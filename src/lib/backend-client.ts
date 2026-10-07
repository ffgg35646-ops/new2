import {
  authGetSession,
  authGetUser,
  authResend,
  authResetPasswordForEmail,
  authSignIn,
  authSignOut,
  authResetPassword,
  authSignUp,
  authUpdateUser,
  authVerifyOtp,
  dbRequest,
  removeMedia,
  rpcRequest,
  uploadMedia,
} from "@/lib/backend.functions";

type Result<T> = {
  data: T;
  error: { message: string } | null;
  count?: number | null;
};

type User = {
  id: string;
  email?: string;
  email_confirmed_at?: string | null;
  user_metadata?: Record<string, unknown>;
};

export type Session = {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  user: User;
};

const listeners = new Set<(event: string, session: Session | null) => void>();

function emit(event: string, session: Session | null) {
  for (const listener of listeners) {
    try {
      listener(event, session);
    } catch {}
  }
}

function errorOf(error: unknown) {
  return error instanceof Error ? { message: error.message } : { message: String(error) };
}

class QueryBuilder<T = unknown> {
  private input: any;

  constructor(collection: string) {
    this.input = {
      collection,
      operation: "select",
      filters: [],
      orders: [],
      limit: null,
      offset: 0,
      select: null,
      single: false,
      maybeSingle: false,
      count: false,
      head: false,
      or: null,
    };
  }

  select(columns = "*", options?: { count?: "exact"; head?: boolean }) {
    this.input.select = columns;
    if (options?.count === "exact") this.input.count = true;
    if (options?.head) this.input.head = true;
    return this;
  }
  eq(field: string, value: unknown) { this.input.filters.push({ field, op: "eq", value }); return this; }
  neq(field: string, value: unknown) { this.input.filters.push({ field, op: "neq", value }); return this; }
  gt(field: string, value: unknown) { this.input.filters.push({ field, op: "gt", value }); return this; }
  gte(field: string, value: unknown) { this.input.filters.push({ field, op: "gte", value }); return this; }
  lt(field: string, value: unknown) { this.input.filters.push({ field, op: "lt", value }); return this; }
  lte(field: string, value: unknown) { this.input.filters.push({ field, op: "lte", value }); return this; }
  in(field: string, value: unknown[]) { this.input.filters.push({ field, op: "in", value }); return this; }
  ilike(field: string, value: string) { this.input.filters.push({ field, op: "ilike", value }); return this; }
  like(field: string, value: string) { this.input.filters.push({ field, op: "like", value }); return this; }
  is(field: string, value: unknown) { this.input.filters.push({ field, op: "eq", value }); return this; }
  contains(field: string, value: unknown) { this.input.filters.push({ field, op: "contains", value }); return this; }
  not(field: string, _operator: string, value: unknown) { this.input.filters.push({ field, op: "neq", value }); return this; }
  or(value: string) { this.input.or = value; return this; }
  order(field: string, options?: { ascending?: boolean }) {
    this.input.orders.push({ field, ascending: options?.ascending !== false });
    return this;
  }
  limit(value: number) { this.input.limit = value; return this; }
  range(from: number, to: number) { this.input.offset = from; this.input.limit = Math.max(0, to - from + 1); return this; }
  single() { this.input.single = true; this.input.limit = 2; return this; }
  maybeSingle() { this.input.maybeSingle = true; this.input.limit = 2; return this; }
  insert(payload: unknown) { this.input.operation = "insert"; this.input.payload = payload; return this; }
  update(payload: unknown) { this.input.operation = "update"; this.input.payload = payload; return this; }
  upsert(payload: unknown) { this.input.operation = "upsert"; this.input.payload = payload; return this; }
  delete() { this.input.operation = "delete"; return this; }

  then<TResult1 = Result<T>, TResult2 = never>(
    onfulfilled?: ((value: Result<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return dbRequest({ data: this.input })
      .then((value: any) => value as Result<T>)
      .then(onfulfilled as any, onrejected as any);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null,
  ) {
    return dbRequest({ data: this.input }).catch(onrejected as any);
  }
}

class Channel {
  private timer: ReturnType<typeof setInterval> | null = null;
  constructor(private readonly table: string) {}
  on(_event: string, _config: unknown, _callback: (payload: any) => void) {
    return this;
  }
  subscribe() {
    return {
      unsubscribe: () => {
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
      },
    };
  }
  unsubscribe() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}

class StorageBucket {
  constructor(private readonly name: string) { void name; }
  async upload(_path: string, file: File) {
    const form = new FormData();
    form.append("file", file, file.name);
    try {
      return await uploadMedia({ data: form });
    } catch (error) {
      return { data: null, error: errorOf(error) };
    }
  }
  async createSignedUrl(path: string, _expiresIn: number) {
    return { data: { signedUrl: "/api/media/" + encodeURIComponent(path) }, error: null };
  }
  async remove(paths: string[]) {
    try {
      for (const path of paths) await removeMedia({ data: { path } });
      return { data: null, error: null };
    } catch (error) {
      return { data: null, error: errorOf(error) };
    }
  }
}

const auth = {
  async signUp(args: { email: string; password: string; options?: { data?: Record<string, unknown> } }) {
    try {
      const result: any = await authSignUp({ data: args as any });
      return { data: { user: result.user, session: result.session }, error: null };
    } catch (error) {
      return { data: { user: null, session: null }, error: errorOf(error) };
    }
  },

  async verifyOtp(args: { email: string; token: string; type?: string }) {
    try {
      const result: any = await authVerifyOtp({ data: args });
      emit("SIGNED_IN", result.session);
      return { data: result, error: null };
    } catch (error) {
      return { data: { user: null, session: null }, error: errorOf(error) };
    }
  },

  async resend(args: { type: string; email: string }) {
    try {
      return { data: await authResend({ data: { email: args.email } }), error: null };
    } catch (error) {
      return { data: null, error: errorOf(error) };
    }
  },

  async signInWithPassword(args: { email: string; password: string }) {
    try {
      const result: any = await authSignIn({ data: args });
      emit("SIGNED_IN", result.session);
      return { data: result, error: null };
    } catch (error) {
      return { data: { user: null, session: null }, error: errorOf(error) };
    }
  },

  async getSession() {
    try { return await authGetSession(); }
    catch (error) { return { data: { session: null }, error: errorOf(error) }; }
  },

  async getUser() {
    try { return await authGetUser(); }
    catch (error) { return { data: { user: null }, error: errorOf(error) }; }
  },

  async signOut() {
    try {
      const result = await authSignOut();
      emit("SIGNED_OUT", null);
      return result;
    } catch (error) {
      return { data: null, error: errorOf(error) };
    }
  },

  async updateUser(attributes: { password?: string; email?: string }) {
    try {
      const result = await authUpdateUser({ data: attributes });
      emit("USER_UPDATED", null);
      return result;
    } catch (error) {
      return { data: null, error: errorOf(error) };
    }
  },

  async resetPassword(email: string, token: string, password: string) {
    try {
      return await authResetPassword({ data: { email, token, password } });
    } catch (error) {
      return { data: null, error: errorOf(error) };
    }
  },

  async resetPasswordForEmail(email: string, options?: { redirectTo?: string }) {
    try {
      const origin = options?.redirectTo ? new URL(options.redirectTo).origin : window.location.origin;
      const result = await authResetPasswordForEmail({ data: { email, origin } });
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error: errorOf(error) };
    }
  },

  async signInWithOtp(args: { email: string; options?: { shouldCreateUser?: boolean } }) {
    try {
      return { data: await authResend({ data: { email: args.email } }), error: null };
    } catch (error) {
      return { data: null, error: errorOf(error) };
    }
  },

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    listeners.add(callback);
    return { data: { subscription: { unsubscribe: () => listeners.delete(callback) } } };
  },
};

export const backend = {
  from<T = unknown>(collection: string) { return new QueryBuilder<T>(collection); },
  rpc(name: string, args?: Record<string, unknown>) { return rpcRequest({ data: { name, args } }); },
  channel(name: string) { return new Channel(name); },
  removeChannel(channel: Channel) { channel.unsubscribe(); },
  storage: { from(name: string) { return new StorageBucket(name); } },
  auth,
};

export type { User };
