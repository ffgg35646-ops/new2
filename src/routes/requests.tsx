import { RoleGuard } from "@/lib/role-guard";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ClipboardList, MessageSquare, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { PaginationControls } from "@/components/PaginationControls";
import { EmptyState, ListSkeleton } from "@/components/EmptyState";
import { useAuth } from "@/lib/auth";
import { CompleteViewingReasonModal } from "@/components/CompleteViewingReasonModal";
import { LISTING_TYPES, PROPERTY_KINDS, REQUEST_STATUS } from "@/lib/constants";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

type RequestRow = {
  id: string;
  kind: string;
  listing: string;
  neighborhood: string | null;
  budget_min: number | null;
  budget_max: number | null;
  area_min: number | null;
  description: string;
  status: string;
  created_at: string;
  expires_at: string | null;
  views_count: number | null;
  office_offers?: OfferRow[] | null;
  accepted_offer_id?: string | null;
  accepted_office_id?: string | null;
  completed_offer_id?: string | null;
  completed_office_id?: string | null;
  attachment_url?: string | null;
  end_reason?: string | null;
};

type IndividualInquiry = {
  id: string;
  property_id: string;
  office_id: string;
  type: string;
  status: string;
  created_at: string;
  message: string | null;
  contact_phone: string | null;
  end_reason?: string | null;
  completion_note?: string | null;
  property: { title: string | null; property_number: string | null } | null;
  office: { id: string; name: string | null; phone: string | null; whatsapp: string | null } | null;
};

type OfferRow = {
  id: string;
  message: string | null;
  price: number | null;
  status: string;
  created_at: string;
  end_reason?: string | null;
  offices: { id: string; name: string; phone: string | null; whatsapp: string | null } | null;
  properties: { id: string; title: string } | null;
  requestId: string;
  requestStatus: string;
  requestKind: string;
  requestListing: string;
  requestDescription: string;
  requestAcceptedOfferId: string | null;
};

export const Route = createFileRoute("/requests")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: search["tab"] === "sent" ? ("sent" as const) : search["tab"] === "accepted" ? ("accepted" as const) : ("received" as const),
    request: typeof search["request"] === "string" ? search["request"] : undefined,
    offer: typeof search["offer"] === "string" ? search["offer"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "الطلبات | عقار البطين" },
      { name: "description", content: "طلباتك العقارية والعروض التي وصلتك من المكاتب." },
    ],
  }),
  component: () => (
    <RoleGuard allow={["individual", "admin"]}>
      <RequestsPage />
    </RoleGuard>
  ),
});

function RequestsPage() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  const search = Route.useSearch();
  const [tab, setTab] = useState<"sent" | "received" | "accepted">(search["tab"]);
  const [activeRequestsPage, setActiveRequestsPage] = useState(1);
  const [receivedOffersPage, setReceivedOffersPage] = useState(1);
  const [endRequestId, setEndRequestId] = useState<string | null>(null);
  const [endInquiryId, setEndInquiryId] = useState<string | null>(null);
  const [completeInquiryId, setCompleteInquiryId] = useState<string | null>(null);
  const [completionRequestId, setCompletionRequestId] = useState<string | null>(null);
  const [completionSearch, setCompletionSearch] = useState("");
  const [selectedCompletionOfferId, setSelectedCompletionOfferId] = useState<string | null>(null);

  useEffect(() => {
    setTab(search["tab"]);
  }, [search["tab"]]);

  useEffect(() => {
    setActiveRequestsPage(1);
    setReceivedOffersPage(1);
  }, [tab, userId]);

  const { data: myRequests = [], isLoading } = useQuery({
    queryKey: ["requests-page", userId],
    enabled: !!userId,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_requests")
        .select(
          "*, office_offers(id,message,price,status,created_at,end_reason,offices(id,name,phone,whatsapp),properties(id,title))",
        )
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as RequestRow[];
    },
  });

  const receivedOffers = useMemo<OfferRow[]>(
    () =>
      myRequests.flatMap((request) =>
        (request.office_offers ?? []).map((offer) => ({
          ...offer,
          requestId: request.id,
          requestStatus: request.status,
          requestKind: request.kind,
          requestListing: request.listing,
          requestDescription: request.description,
          requestAcceptedOfferId: request.accepted_offer_id ? String(request.accepted_offer_id) : null,
        })),
      ),
    [myRequests],
  );

  const { data: personalInquiries = [], isLoading: inquiriesLoading } = useQuery<IndividualInquiry[]>({
    queryKey: ["individual-property-inquiries", userId],
    enabled: !!userId,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("property_inquiries")
        .select("id,property_id,office_id,type,status,created_at,message,contact_phone,end_reason,completion_note")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      if (!rows?.length) return [];

      const propertyIds = [...new Set(rows.map((row: any) => String(row.property_id ?? "")).filter(Boolean))];
      const officeIds = [...new Set(rows.map((row: any) => String(row.office_id ?? "")).filter(Boolean))];
      const [propertyResult, officeResult] = await Promise.all([
        propertyIds.length
          ? supabase.from("properties").select("id,title,property_number").in("id", propertyIds)
          : Promise.resolve({ data: [], error: null }),
        officeIds.length
          ? supabase.from("offices").select("id,name,phone,whatsapp").in("id", officeIds)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (propertyResult.error) throw propertyResult.error;
      if (officeResult.error) throw officeResult.error;

      const propertiesById = new Map((propertyResult.data ?? []).map((row: any) => [String(row.id), row]));
      const officesById = new Map((officeResult.data ?? []).map((row: any) => [String(row.id), row]));
      return rows.map((row: any) => ({
        id: String(row.id),
        property_id: String(row.property_id ?? ""),
        office_id: String(row.office_id ?? ""),
        type: String(row.type ?? "question"),
        status: String(row.status ?? "new"),
        created_at: String(row.created_at ?? ""),
        message: row.message == null ? null : String(row.message),
        contact_phone: row.contact_phone == null ? null : String(row.contact_phone),
        end_reason: row.end_reason == null ? null : String(row.end_reason),
        completion_note: row.completion_note == null ? null : String(row.completion_note),
        property: propertiesById.get(String(row.property_id ?? "")) as IndividualInquiry["property"] ?? null,
        office: officesById.get(String(row.office_id ?? "")) as IndividualInquiry["office"] ?? null,
      })) as IndividualInquiry[];
    },
  });

  const acceptedMarketRequests = useMemo(
    () => myRequests.filter((request) =>
      !!request.accepted_offer_id && request.status === "active",
    ),
    [myRequests],
  );
  const acceptedPersonalInquiries = useMemo(
    () => personalInquiries.filter((inquiry) => inquiry.status === "accepted"),
    [personalInquiries],
  );
  const acceptedCount = acceptedMarketRequests.length + acceptedPersonalInquiries.length;
  const acceptedMarketRequestIds = useMemo(
    () => new Set(myRequests
      .filter((request) =>
        !!request.accepted_offer_id && ["active", "fulfilled"].includes(request.status),
      )
      .map((request) => request.id)),
    [myRequests],
  );
  const displayedReceivedOffers = useMemo(
    () => receivedOffers.filter((offer) => !acceptedMarketRequestIds.has(offer.requestId)),
    [receivedOffers, acceptedMarketRequestIds],
  );

  useEffect(() => {
    if (!myRequests.length) return;
    const targetId = search["offer"] ? "offer-card-" + search["offer"] : search["request"] ? "request-card-" + search["request"] : null;
    if (!targetId) return;
    window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  }, [search["offer"], search["request"], myRequests.length, receivedOffers.length]);

  const endRequest = useMutation({
    mutationFn: async (vars: { id: string; reason: string }) => {
      const { error } = await supabase.rpc("individual_end_property_request" as never, {
        _request_id: vars.id, _reason: vars.reason,
      } as never);
      if (error) throw error;
    },
    onSuccess: async () => {
      setEndRequestId(null);
      toast.success("تم إنهاء الطلب وإرسال إشعار للمكتب");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["requests-page"] }),
        qc.invalidateQueries({ queryKey: ["open-requests"] }),
        qc.invalidateQueries({ queryKey: ["office-accepted-property-requests"] }),
        qc.invalidateQueries({ queryKey: ["office-sent-offers"] }),
        qc.invalidateQueries({ queryKey: ["unread-notifications"] }),
      ]);
      setTab("accepted");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "تعذّر إنهاء الطلب"),
  });

  const updateInquiryStatus = useMutation({
    mutationFn: async (vars: { id: string; status: "ended" | "completed"; reason: string }) => {
      const { error } = await supabase.rpc("individual_update_property_inquiry" as never, {
        _inquiry_id: vars.id,
        _status: vars.status,
        _reason: vars.reason,
      } as never);
      if (error) throw error;
      return vars;
    },
    onSuccess: async (vars) => {
      setEndInquiryId(null);
      setCompleteInquiryId(null);
      toast.success(vars.status === "completed"
        ? "تم تسجيل اكتمال طلب التواصل وإشعار المكتب"
        : "تم إنهاء طلب التواصل وإشعار المكتب");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["individual-property-inquiries"] }),
        qc.invalidateQueries({ queryKey: ["office-inquiries"] }),
        qc.invalidateQueries({ queryKey: ["office-inquiries-tab-count"] }),
        qc.invalidateQueries({ queryKey: ["unread-notifications"] }),
      ]);
      setTab("accepted");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "تعذّر تحديث طلب التواصل"),
  });

  const setOfferStatus = useMutation({
    mutationFn: async (vars: { id: string; status: "accepted" | "rejected" }) => {
      const { error } = await supabase.rpc(
        "respond_to_property_offer" as never,
        { _offer_id: vars.id, _status: vars.status } as never,
      );
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success(vars.status === "accepted" ? "تم قبول العرض وانتقل الطلب إلى طلبات التواصل الخاصة بالمكتب" : "تم رفض العرض");
      void qc.invalidateQueries({ queryKey: ["requests-page"] });
      void qc.invalidateQueries({ queryKey: ["office-sent-offers"] });
      void qc.invalidateQueries({ queryKey: ["unread-notifications"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "تعذّر تحديث العرض"),
  });

  const completeRequest = useMutation({
    mutationFn: async (vars: { requestId: string; offerId: string }) => {
      const { error } = await supabase.rpc("complete_property_request_with_office" as never, {
        _request_id: vars.requestId, _offer_id: vars.offerId,
      } as never);
      if (error) throw error;
    },
    onSuccess: async () => {
      setCompletionRequestId(null);
      setCompletionSearch("");
      setSelectedCompletionOfferId(null);
      toast.success("تم تسجيل الطلب مكتملًا وإشعار المكاتب");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["requests-page"] }),
        qc.invalidateQueries({ queryKey: ["open-requests"] }),
        qc.invalidateQueries({ queryKey: ["office-accepted-property-requests"] }),
        qc.invalidateQueries({ queryKey: ["office-sent-offers"] }),
        qc.invalidateQueries({ queryKey: ["unread-notifications"] }),
      ]);
      setTab("accepted");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "تعذّر تأكيد اكتمال الطلب"),
  });

  const activeSent = myRequests.filter((request) =>
    request.status === "active" && !request.accepted_offer_id,
  ).length;
  const receivedCount = displayedReceivedOffers.length;
  const pageSize = 6;
  const receivedPageCount = Math.max(1, Math.ceil(displayedReceivedOffers.length / pageSize));
  const currentReceivedPage = Math.min(receivedOffersPage, receivedPageCount);
  const visibleReceivedOffers = displayedReceivedOffers.slice(
    (currentReceivedPage - 1) * pageSize,
    currentReceivedPage * pageSize,
  );
  const completionCandidates = receivedOffers.filter((offer) =>
    offer.requestId === completionRequestId && !!offer.offices &&
    ["sent", "accepted", "awaiting_confirmation", "ended"].includes(offer.status),
  );
  const filteredCompletionCandidates = completionCandidates.filter((offer) => {
    const query = completionSearch.trim().toLocaleLowerCase("ar");
    return !query || String(offer.offices?.name ?? "").toLocaleLowerCase("ar").includes(query);
  });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <AppHeader showSearch={false} />
      <main className="flex-1 space-y-4 px-4 py-4">
        <div>
          <h1 className="font-display text-xl font-extrabold">الطلبات</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            طلباتك المرسلة والعروض التي تستقبلها من المكاتب.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-surface p-1.5 ring-1 ring-line">
          <Tab active={tab === "sent"} label="المرسلة" count={activeSent} onClick={() => setTab("sent")} />
          <Tab active={tab === "received"} label="مستلم" count={receivedCount} onClick={() => setTab("received")} />
          <Tab active={tab === "accepted"} label="المقبولة" count={acceptedCount} onClick={() => setTab("accepted")} />
        </div>

        {isLoading ? (
          <ListSkeleton />
        ) : tab === "sent" ? (
          (() => {
            const activeRequests = myRequests.filter((request) =>
              request.status === "active" && !request.accepted_offer_id,
            );
            const activePageCount = Math.max(1, Math.ceil(activeRequests.length / pageSize));
            const currentActivePage = Math.min(activeRequestsPage, activePageCount);
            const visibleActiveRequests = activeRequests.slice(
              (currentActivePage - 1) * pageSize,
              currentActivePage * pageSize,
            );
            if (!activeRequests.length) {
              return (
                <EmptyState
                  icon={ClipboardList}
                  title="لا توجد طلبات مرسلة نشطة"
                  
                />
              );
            }

            return (
              <div className="space-y-4">
                {activeRequests.length > 0 && (
                  <section>
                    <div className="mb-2 flex items-center justify-between">
                      <h2 className="font-display text-sm font-extrabold">الطلبات النشطة</h2>
                      <span className="text-[11px] text-muted-foreground">
                        {activeRequests.length} طلب
                      </span>
                    </div>
                    <div className="space-y-2">
                      {visibleActiveRequests.map((request) => (
                        <RequestCard
                          key={request.id}
                          request={request}
                          highlighted={search["request"] === request.id}
                          pending={endRequest.isPending}
                          onEnd={() => setEndRequestId(request.id)}
                        />
                      ))}
                    </div>
                    <PaginationControls
                      page={currentActivePage}
                      total={activeRequests.length}
                      pageSize={pageSize}
                      onPageChange={setActiveRequestsPage}
                    />
                  </section>
                )}

              </div>
            );
          })()
        ) : tab === "accepted" ? (
          inquiriesLoading ? (
            <ListSkeleton />
          ) : (
            <AcceptedPrioritySection
              requests={acceptedMarketRequests}
              inquiries={acceptedPersonalInquiries}
              pending={endRequest.isPending || completeRequest.isPending || updateInquiryStatus.isPending}
              onEndRequest={(id) => setEndRequestId(id)}
              onCompleteRequest={(id) => { setCompletionRequestId(id); setCompletionSearch(""); setSelectedCompletionOfferId(null); }}
              onEndInquiry={(id) => setEndInquiryId(id)}
              onCompleteInquiry={(id) => setCompleteInquiryId(id)}
            />
          )

          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-sm font-extrabold">طلبات مستلمة</h2>
              <span className="min-w-6 rounded-full bg-terracotta-soft px-2 py-1 text-center text-[10px] font-extrabold text-terracotta">{displayedReceivedOffers.length}</span>
            </div>
            {visibleReceivedOffers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                pending={setOfferStatus.isPending || completeRequest.isPending}
                onStatus={(status) => setOfferStatus.mutate({ id: offer.id, status })}
                highlighted={search["offer"] === offer.id}
                canMarkComplete={!!offer.requestAcceptedOfferId && offer.requestStatus === "active" && offer.id === offer.requestAcceptedOfferId}
                onMarkComplete={() => { setCompletionRequestId(offer.requestId); setCompletionSearch(""); setSelectedCompletionOfferId(null); }}
              />
            ))}
            <PaginationControls
              page={currentReceivedPage}
              total={displayedReceivedOffers.length}
              pageSize={pageSize}
              onPageChange={setReceivedOffersPage}
            />
          </section>
        ) : (
          <EmptyState
            icon={ClipboardList}
            title="لا توجد عروض مستقبلة"
            
          />
        )}

      </main>

      <CompleteViewingReasonModal
        open={!!endRequestId} pending={endRequest.isPending} optionalReason
        title="إنهاء الطلب" heading="هل تريد إنهاء الطلب؟ يمكنك ذكر السبب اختياريًا."
        reasonLabel="سبب الإنهاء (اختياري)" placeholder="اكتب سبب الإنهاء إن رغبت"
        confirmLabel="تأكيد إنهاء الطلب"
        onClose={() => { if (!endRequest.isPending) setEndRequestId(null); }}
        onConfirm={(reason) => { if (endRequestId) endRequest.mutate({ id: endRequestId, reason }); }}
      />
      <CompleteViewingReasonModal
        open={!!endInquiryId}
        pending={updateInquiryStatus.isPending}
        optionalReason
        title="إنهاء طلب التواصل"
        heading="هل تريد إنهاء طلب التواصل مع المكتب؟"
        reasonLabel="سبب الإنهاء (اختياري)"
        placeholder="اكتب سبب الإنهاء إن رغبت"
        confirmLabel="تأكيد إنهاء الطلب"
        variant="reject"
        onClose={() => { if (!updateInquiryStatus.isPending) setEndInquiryId(null); }}
        onConfirm={(reason) => { if (endInquiryId) updateInquiryStatus.mutate({ id: endInquiryId, status: "ended", reason }); }}
      />
      <CompleteViewingReasonModal
        open={!!completeInquiryId}
        pending={updateInquiryStatus.isPending}
        optionalReason
        title="اكتمال طلب التواصل"
        heading="هل تؤكد اكتمال طلب التواصل مع المكتب؟"
        reasonLabel="ملاحظة (اختياري)"
        placeholder="أضف ملاحظة اختيارية"
        confirmLabel="تأكيد اكتمال الطلب"
        onClose={() => { if (!updateInquiryStatus.isPending) setCompleteInquiryId(null); }}
        onConfirm={(reason) => { if (completeInquiryId) updateInquiryStatus.mutate({ id: completeInquiryId, status: "completed", reason }); }}
      />

      {completionRequestId && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 p-3" role="dialog" aria-modal="true"
          aria-label="اختيار المكتب الذي اكتمل الطلب معه" onClick={() => {
            if (!completeRequest.isPending) { setCompletionRequestId(null); setSelectedCompletionOfferId(null); }
          }}>
          <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-[28px] bg-surface p-4 shadow-2xl ring-1 ring-line"
            onClick={(event) => event.stopPropagation()} dir="rtl">
            <h2 className="font-display text-lg font-extrabold">الطلب مكتمل</h2>
            
            <input value={completionSearch} onChange={(event) => { setCompletionSearch(event.target.value); setSelectedCompletionOfferId(null); }}
              placeholder="اكتب أول حرف من اسم المكتب" aria-label="ابحث عن مكتب" className="mt-3 w-full rounded-xl bg-sand px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-forest" />
            <div className="mt-3 space-y-2">
              {filteredCompletionCandidates.map((candidate) => (
                <button type="button" key={candidate.id} onClick={() => setSelectedCompletionOfferId(candidate.id)}
                  className={cn("w-full rounded-xl p-3 text-right ring-1", selectedCompletionOfferId === candidate.id ? "bg-forest-soft text-forest ring-forest" : "bg-background text-foreground ring-line")}>
                  <span className="block text-sm font-extrabold">{candidate.offices?.name ?? "مكتب عقاري"}</span>
                  {candidate.message && <span className="mt-1 block text-xs leading-5 text-muted-foreground">{candidate.message}</span>}
                  {candidate.price != null && <span className="mt-1 block text-xs font-bold">{formatPrice(candidate.price)} ر.س</span>}
                </button>
              ))}
              {!filteredCompletionCandidates.length && <p className="rounded-xl bg-background p-3 text-xs text-muted-foreground">لا توجد مكاتب مطابقة لهذا البحث على الطلب.</p>}
            </div>
            <button type="button" onClick={() => { if (completionRequestId && selectedCompletionOfferId) completeRequest.mutate({ requestId: completionRequestId, offerId: selectedCompletionOfferId }); }}
              disabled={!selectedCompletionOfferId || completeRequest.isPending} className="mt-3 flex w-full items-center justify-center rounded-xl bg-forest py-3 text-sm font-bold text-background disabled:opacity-50">
              {completeRequest.isPending ? "جارٍ التأكيد..." : "تأكيد أن الطلب مكتمل"}
            </button>
            <button type="button" onClick={() => { if (!completeRequest.isPending) { setCompletionRequestId(null); setSelectedCompletionOfferId(null); } }}
              disabled={completeRequest.isPending} className="mt-2 w-full rounded-xl bg-background py-3 text-sm font-bold ring-1 ring-line">رجوع</button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

function AcceptedPrioritySection({
  requests,
  inquiries,
  pending,
  onEndRequest,
  onCompleteRequest,
  onEndInquiry,
  onCompleteInquiry,
}: {
  requests: RequestRow[];
  inquiries: IndividualInquiry[];
  pending: boolean;
  onEndRequest: (id: string) => void;
  onCompleteRequest: (id: string) => void;
  onEndInquiry: (id: string) => void;
  onCompleteInquiry: (id: string) => void;
}) {
  const total = requests.length + inquiries.length;
  return (
    <section className="space-y-2" aria-label="طلبات مقبولة">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-sm font-extrabold">طلبات مقبولة</h2>
        {total > 0 && (
          <span className="min-w-6 rounded-full bg-forest-soft px-2 py-1 text-center text-[10px] font-extrabold text-forest" aria-label={String(total) + " طلب مقبول"}>{total > 99 ? "99+" : total}</span>
        )}
      </div>

      

      {requests.map((request) => {
        const isCompleted = request.status === "fulfilled";
        const selectedOfferId = isCompleted
          ? request.completed_offer_id || request.accepted_offer_id
          : request.accepted_offer_id;
        const offer = (request.office_offers ?? []).find((item) => item.id === selectedOfferId)
          ?? (request.office_offers ?? []).find((item) => item.id === request.accepted_offer_id);
        const office = offer?.offices;
        return (
          <article key={request.id} id={"accepted-request-card-" + request.id}
            className="space-y-1.5 rounded-xl bg-surface p-2.5 ring-1 ring-forest/20 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-display text-sm font-extrabold">
                  {PROPERTY_KINDS.find((kind) => kind.value === request.kind)?.label ?? "عقار"} · {LISTING_TYPES.find((type) => type.value === request.listing)?.label ?? "طلب عقاري"}
                </h3>
                <p className="mt-1 text-[11px] text-muted-foreground">{formatDate(request.created_at)}</p>
              </div>
              <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold",
                isCompleted ? "bg-forest text-background" : "bg-forest-soft text-forest")}>
                {isCompleted ? "مكتمل" : "تم قبول العرض"}
              </span>
            </div>

            {request.attachment_url && (
              <img src={request.attachment_url} alt="صورة الطلب" loading="lazy"
                className="h-20 w-full rounded-lg object-cover" />
            )}

            <details className="rounded-lg bg-background px-3 py-2 ring-1 ring-line">
              <summary className="cursor-pointer text-xs font-bold text-forest">تفاصيل الطلب والميزانية</summary>
              <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-muted-foreground">{request.description || "لا يوجد وصف إضافي."}</p>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                <span><span className="text-muted-foreground">الحي: </span><strong>{request.neighborhood || "أي حي"}</strong></span>
                <span><span className="text-muted-foreground">الميزانية: </span><strong>{request.budget_min != null || request.budget_max != null ? formatPrice(request.budget_min) + " - " + formatPrice(request.budget_max) + " ر.س" : "غير محددة"}</strong></span>
                <span><span className="text-muted-foreground">المساحة: </span><strong>{request.area_min != null ? "من " + request.area_min + " م²" : "غير محددة"}</strong></span>
              </div>
            </details>

            {offer && (offer.message || offer.price != null) && (
              <details className="rounded-lg bg-forest-soft px-3 py-2 text-xs leading-5 text-forest">
                <summary className="cursor-pointer font-extrabold">تفاصيل العرض{offer.price != null ? " · " + formatPrice(offer.price) + " ر.س" : ""}</summary>
                {offer.message && <p className="mt-1 whitespace-pre-wrap">{offer.message}</p>}
                {offer.price != null && <p className="mt-1 font-extrabold">السعر المقترح: {formatPrice(offer.price)} ر.س</p>}
              </details>
            )}

            <Link
              to="/chats"
              search={{ c: undefined, office: office?.id }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest py-2.5 text-xs font-bold text-background"
            >
              <MessageSquare className="size-4" /> الدردشة مع المكتب
            </Link>

            {isCompleted ? (
              <div className="rounded-xl bg-forest-soft py-2.5 text-center text-xs font-bold text-forest">مكتمل</div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => onEndRequest(request.id)} disabled={pending}
                  className="rounded-lg bg-terracotta-soft py-2 text-[11px] font-bold text-terracotta disabled:opacity-50">
                  إنهاء الطلب
                </button>
                <button type="button" onClick={() => onCompleteRequest(request.id)}
                  className="rounded-lg bg-forest py-2 text-[11px] font-bold text-background">
                  تم اكتمال الطلب
                </button>
              </div>
            )}
          </article>
        );
      })}

      {inquiries.map((inquiry) => {
        const inquiryLabel: Record<string, string> = { viewing: "معاينة", buy: "شراء", rent: "استئجار", question: "استفسار" };
        return (
          <article key={inquiry.id} id={"accepted-inquiry-card-" + inquiry.id}
            className="space-y-2 rounded-xl bg-surface p-3 ring-1 ring-forest/20 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-display text-sm font-extrabold">{inquiry.property?.title || "عقار المكتب"}</h3>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {inquiry.property?.property_number ? "رقم العقار: " + inquiry.property.property_number + " · " : ""}
                  {inquiryLabel[inquiry.type] || "طلب تواصل"} · {formatDate(inquiry.created_at)}
                </p>
              </div>
              <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold", inquiry.status === "completed" ? "bg-forest text-background" : "bg-forest-soft text-forest")}>
                {inquiry.status === "completed" ? "مكتمل" : "المكتب وافق على طلبك"}
              </span>
            </div>
            {inquiry.message && <details className="rounded-lg bg-background px-3 py-2 ring-1 ring-line"><summary className="cursor-pointer text-xs font-bold text-forest">رسالة الطلب</summary><p className="mt-2 whitespace-pre-wrap text-xs leading-5">{inquiry.message}</p></details>}
            <Link
              to="/chats"
              search={{ c: undefined, office: inquiry.office?.id }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest py-2.5 text-xs font-bold text-background"
            >
              <MessageSquare className="size-4" /> الدردشة مع المكتب
            </Link>

            <a href={"/properties/" + encodeURIComponent(inquiry.property_id)}
              className="block rounded-xl bg-background py-2.5 text-center text-xs font-bold text-forest ring-1 ring-line">تفاصيل العقار</a>
            {inquiry.status === "completed" ? (
              <div className="rounded-xl bg-forest-soft py-2.5 text-center text-xs font-bold text-forest">مكتمل</div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => onEndInquiry(inquiry.id)} disabled={pending}
                  className="rounded-lg bg-terracotta-soft py-2 text-[11px] font-bold text-terracotta disabled:opacity-50">إنهاء الطلب</button>
                <button type="button" onClick={() => onCompleteInquiry(inquiry.id)}
                  className="rounded-lg bg-forest py-2 text-[11px] font-bold text-background">تم اكتمال الطلب</button>
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}

function OfferCard({
  offer, pending, onStatus, highlighted, canMarkComplete, onMarkComplete,
}: {
  offer: OfferRow; pending: boolean;
  onStatus: (status: "accepted" | "rejected") => void; highlighted: boolean;
  canMarkComplete: boolean; onMarkComplete: () => void;
}) {
  const office = offer.offices;
  const canRespond = offer.status === "sent" && offer.requestStatus === "active";
  return (
    <div id={"offer-card-" + offer.id} className={cn("rounded-2xl bg-surface p-3 ring-1 ring-line", highlighted && "ring-2 ring-forest")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><div className="font-display text-sm font-extrabold">{office?.name ?? "مكتب عقاري"}</div><div className="mt-1 text-[11px] text-muted-foreground">عرض على طلبك · {formatDate(offer.created_at)}</div></div>
        <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold",
          offer.status === "accepted" || offer.status === "completed" ? "bg-forest-soft text-forest" :
          offer.status === "rejected" || offer.status === "ended" || offer.status === "deleted" ? "bg-terracotta-soft text-terracotta" : "bg-sand text-muted-foreground")}>
          {offer.status === "sent" ? "جديد" : offer.status === "accepted" ? "مقبول" : offer.status === "rejected" ? "مرفوض" :
            offer.status === "awaiting_confirmation" ? "بانتظار تأكيدك" : offer.status === "completed" ? "مكتمل" :
            offer.status === "ended" || offer.status === "deleted" ? "منتهي" : offer.status}
        </span>
      </div>
      <div className="mt-2 rounded-2xl bg-background p-3 ring-1 ring-line">
        <div className="text-[10px] font-semibold text-muted-foreground">طلبك</div>
        <div className="mt-1 text-sm font-bold">{PROPERTY_KINDS.find((k) => k.value === offer.requestKind)?.label ?? "عقار"} · {LISTING_TYPES.find((l) => l.value === offer.requestListing)?.label ?? "طلب"}</div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{offer.requestDescription}</p>
      </div>
      {offer.message && <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-sand p-3 text-sm leading-6 text-muted-foreground">{offer.message}</p>}
      {offer.price != null && <div className="mt-2 text-lg font-display font-extrabold text-forest">{formatPrice(offer.price)} <span className="text-sm">ر.س</span></div>}
      {offer.properties?.title && <div className="mt-2 rounded-xl bg-forest-soft p-2.5 text-xs font-semibold text-forest">العقار المقترح: {offer.properties.title}</div>}
      {canRespond && (
        <Link
        to="/chats"
        search={{ c: undefined, office: office?.id }}
        onClick={(event) => event.stopPropagation()}
        className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl bg-forest py-2.5 text-xs font-bold text-background"
      >
        <MessageSquare className="size-4" /> الدردشة مع المكتب
      </Link>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-background p-2.5 ring-1 ring-line">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="mt-1 text-xs font-bold">{children}</div>
    </div>
  );
}
