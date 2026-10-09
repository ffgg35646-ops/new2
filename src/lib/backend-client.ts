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

type QueryRow = any;
type QueryRows = QueryRow[];
type SingleValue<T> = T extends readonly (infer Row)[] ? Row : T;
type MaybeSingleValue<T> = T extends readonly (infer Row)[] ? Row | null : T | null;

type User = {
  id: string;
  email?: string;
  phone?: string | null;
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

class QueryBuilder<T = QueryRows> implements PromiseLike<Result<T>> {
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
  single(): QueryBuilder<SingleValue<T>> {
    this.input.single = true;
    this.input.limit = 2;
    return this as unknown as QueryBuilder<SingleValue<T>>;
  }
  maybeSingle(): QueryBuilder<MaybeSingleValue<T>> {
    this.input.maybeSingle = true;
    this.input.limit = 2;
    return this as unknown as QueryBuilder<MaybeSingleValue<T>>;
  }
  insert(payload: unknown) { this.input.operation = "insert"; this.input.payload = payload; return this; }
  update(payload: unknown) { this.input.operation = "update"; this.input.payload = payload; return this; }
  upsert(payload: unknown, options?: { onConflict?: string }) {
    this.input.operation = "upsert";
    this.input.payload = payload;
    this.input.onConflict = options?.onConflict ?? null;
    return this;
  }
  delete() { this.input.operation = "delete"; return this; }

  then<TResult1 = Result<T>, TResult2 = never>(
    onfulfilled?: ((value: Result<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    const request = dbRequest({ data: this.input }) as unknown as Promise<Result<T>>;
    return request.then(
      onfulfilled ?? undefined,
      onrejected ?? undefined,
    );
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null,
  ): Promise<Result<T> | TResult> {
    const request = dbRequest({ data: this.input }) as unknown as Promise<Result<T>>;
    return request.catch(onrejected ?? undefined);
  }
}

type ChannelConfig = {
  event?: string;
  schema?: string;
  table?: string;
  filter?: string;
};

type ChannelHandler = {
  table: string;
  filterField: string | null;
  filterValue: string | null;
  callback: (payload: any) => void;
  lastSignature: string;
};

class Channel {
  private handlers: ChannelHandler[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly presenceKey: string;
  private readonly localPresence: Record<string, Array<Record<string, unknown>>> = {};

  constructor(
    private readonly name: string,
    options?: { config?: { presence?: { key?: string } } },
  ) {
    this.presenceKey = options?.config?.presence?.key ?? name;
  }

  on(_event: string, config: ChannelConfig, callback: (payload: any) => void) {
    const match = config.filter?.match(/^([a-zA-Z0-9_]+)=eq\\.(.*)$/);
    this.handlers.push({
      table: config.table ?? this.name,
      filterField: match?.[1] ?? null,
      filterValue: match?.[2] ? decodeURIComponent(match[2]) : null,
      callback,
      lastSignature: "",
    });
    return this;
  }

  private async pollHandler(handler: ChannelHandler) {
    try {
      let query: any = backend
        .from(handler.table)
        .select("*")
        .order("updated_at", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(20);

      if (handler.filterField && handler.filterValue != null) {
        query = query.eq(handler.filterField, handler.filterValue);
      }

      const result = await query;
      if (result.error) return;
      const rows = Array.isArray(result.data) ? result.data : [];
      const signature = rows.map((row: any) =>
        String(row.id ?? row._id ?? row.updated_at ?? row.created_at ?? ""),
      ).join("|");
      if (!signature || signature === handler.lastSignature) return;

      const previous = handler.lastSignature;
      handler.lastSignature = signature;
      if (!previous) return;

      handler.callback({
        eventType: "*",
        new: rows[0] ?? null,
        old: null,
      });
    } catch {
      // Best effort polling: the main query continues to work if polling fails.
    }
  }

  subscribe(callback?: (status: string) => void) {
    const poll = async () => {
      await Promise.all(this.handlers.map((handler) => this.pollHandler(handler)));
    };

    void poll();
    this.timer = setInterval(() => void poll(), 5000);
    callback?.("SUBSCRIBED");

    return {
      unsubscribe: () => this.unsubscribe(),
    };
  }

  presenceState<T extends Record<string, unknown> = Record<string, unknown>>() {
    return this.localPresence as Record<string, T[]>;
  }

  async track(payload: Record<string, unknown>) {
    this.localPresence[this.presenceKey] = [payload];
    for (const handler of this.handlers) {
      if (handler.table === "presence") {
        handler.callback({ eventType: "SYNC", new: this.localPresence, old: null });
      }
    }
    return "ok" as const;
  }

  unsubscribe() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.handlers = [];
  }
}
class StorageBucket {
  constructor(private readonly name: string) { void name; }
  async upload(
    path: string,
    file: File,
    _options?: { contentType?: string; upsert?: boolean },
  ) {
    const form = new FormData();
    form.append("file", file, file.name);
    const parts = path.split("/").filter(Boolean);
    form.append("uploaderId", parts[0] ?? "");
    form.append("folder", parts[1] === "support" ? "support" : parts[1] === "licenses" ? "licenses" : "properties");
    try {
      const result = await uploadMedia({ data: form });
      return {
        data: result.data ? { path: result.data.path } : null,
        error: result.error,
      };
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
  from<T = QueryRows>(collection: string) { return new QueryBuilder<T>(collection); },
  rpc(name: string, args?: Record<string, unknown>): Promise<Result<any>> {
    return rpcRequest({ data: { name, args } }) as unknown as Promise<Result<any>>;
  },
  channel(name: string, options?: { config?: { presence?: { key?: string } } }) {
    return new Channel(name, options);
  },
  removeChannel(channel: Channel | { unsubscribe: () => void }) { channel.unsubscribe(); },
  storage: { from(name: string) { return new StorageBucket(name); } },
  auth,
};

export type { User };
