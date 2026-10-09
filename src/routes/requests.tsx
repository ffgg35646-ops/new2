import { RoleGuard } from "@/lib/role-guard";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ClipboardList, Copy, Phone, XCircle } from "lucide-react";
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
import { whatsappHref } from "@/lib/office";
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
    tab: search.tab === "sent" ? "sent" : "received",
    request: typeof search.request === "string" ? search.request : undefined,
    offer: typeof search.offer === "string" ? search.offer : undefined,
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
  const [tab, setTab] = useState<"sent" | "received">(search.tab);
  const [openOfferId, setOpenOfferId] = useState<string | null>(null);
  const [activeRequestsPage, setActiveRequestsPage] = useState(1);
  const [historyRequestsPage, setHistoryRequestsPage] = useState(1);
  const [receivedOffersPage, setReceivedOffersPage] = useState(1);
  const [endRequestId, setEndRequestId] = useState<string | null>(null);
  const [endInquiryId, setEndInquiryId] = useState<string | null>(null);
  const [completeInquiryId, setCompleteInquiryId] = useState<string | null>(null);
  const [completionRequestId, setCompletionRequestId] = useState<string | null>(null);
  const [completionSearch, setCompletionSearch] = useState("");
  const [selectedCompletionOfferId, setSelectedCompletionOfferId] = useState<string | null>(null);

  useEffect(() => {
    setTab(search.tab);
  }, [search.tab]);

  useEffect(() => {
    setActiveRequestsPage(1);
    setHistoryRequestsPage(1);
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
        .select("id,property_id,office_id,type,status,created_at,message,contact_phone,end_reason")
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
    () => personalInquiries.filter((inquiry) => ["accepted", "completed"].includes(inquiry.status)),
    [personalInquiries],
  );
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
    const targetId = search.offer ? "offer-card-" + search.offer : search.request ? "request-card-" + search.request : null;
    if (!targetId) return;
    window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  }, [search.offer, search.request, myRequests.length, receivedOffers.length]);

  const endRequest = useMutation({
    mutationFn: async (vars: { id: string; reason: string }) => {
      const { error } = await supabase.rpc("individual_end_property_request" as never, {
        _request_id: vars.id, _reason: vars.reason,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      setEndRequestId(null);
      toast.success("تم إنهاء الطلب وإرسال إشعار للمكتب");
      void qc.invalidateQueries({ queryKey: ["requests-page"] });
      void qc.invalidateQueries({ queryKey: ["open-requests"] });
      void qc.invalidateQueries({ queryKey: ["office-accepted-property-requests"] });
      void qc.invalidateQueries({ queryKey: ["office-sent-offers"] });
      void qc.invalidateQueries({ queryKey: ["unread-notifications"] });
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
    onSuccess: (vars) => {
      setEndInquiryId(null);
      setCompleteInquiryId(null);
      toast.success(vars.status === "completed"
        ? "تم تسجيل اكتمال طلب التواصل وإشعار المكتب"
        : "تم إنهاء طلب التواصل وإشعار المكتب");
      void qc.invalidateQueries({ queryKey: ["individual-property-inquiries"] });
      void qc.invalidateQueries({ queryKey: ["office-inquiries"] });
      void qc.invalidateQueries({ queryKey: ["office-inquiries-tab-count"] });
      void qc.invalidateQueries({ queryKey: ["unread-notifications"] });
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
    onSuccess: () => {
      setCompletionRequestId(null);
      setCompletionSearch("");
      setSelectedCompletionOfferId(null);
      toast.success("تم تسجيل الطلب مكتملًا وإشعار المكاتب");
      void qc.invalidateQueries({ queryKey: ["requests-page"] });
      void qc.invalidateQueries({ queryKey: ["open-requests"] });
      void qc.invalidateQueries({ queryKey: ["office-accepted-property-requests"] });
      void qc.invalidateQueries({ queryKey: ["office-sent-offers"] });
      void qc.invalidateQueries({ queryKey: ["unread-notifications"] });
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

        {!isLoading && !inquiriesLoading && (
          <AcceptedPrioritySection
            requests={acceptedMarketRequests}
            inquiries={acceptedPersonalInquiries}
            pending={endRequest.isPending || completeRequest.isPending || updateInquiryStatus.isPending}
            onEndRequest={(id) => setEndRequestId(id)}
            onCompleteRequest={(id) => { setCompletionRequestId(id); setCompletionSearch(""); setSelectedCompletionOfferId(null); }}
            onEndInquiry={(id) => setEndInquiryId(id)}
            onCompleteInquiry={(id) => setCompleteInquiryId(id)}
          />
        )}

        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-surface p-1.5 ring-1 ring-line">
          <Tab active={tab === "sent"} label="المرسلة" count={activeSent} onClick={() => setTab("sent")} />
          <Tab active={tab === "received"} label="مستلم" count={receivedCount} onClick={() => setTab("received")} />
        </div>

        {isLoading ? (
          <ListSkeleton />
        ) : tab === "sent" ? (
          (() => {
            const activeRequests = myRequests.filter((request) =>
              request.status === "active" && !request.accepted_offer_id,
            );
            const historyRequests = myRequests.filter((request) =>
              request.status !== "active",
            );
            const activePageCount = Math.max(1, Math.ceil(activeRequests.length / pageSize));
            const currentActivePage = Math.min(activeRequestsPage, activePageCount);
            const visibleActiveRequests = activeRequests.slice(
              (currentActivePage - 1) * pageSize,
              currentActivePage * pageSize,
            );
            const historyPageCount = Math.max(1, Math.ceil(historyRequests.length / pageSize));
            const currentHistoryPage = Math.min(historyRequestsPage, historyPageCount);
            const visibleHistoryRequests = historyRequests.slice(
              (currentHistoryPage - 1) * pageSize,
              currentHistoryPage * pageSize,
            );

            if (!myRequests.length) {
              return (
                <EmptyState
                  icon={ClipboardList}
                  title="لا توجد طلبات مرسلة"
                  description="ابدأ بنشر طلب عقاري ليصل إلى المكاتب الموثقة."
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
                          highlighted={search.request === request.id}
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

                {historyRequests.length > 0 && (
                  <section className="border-t border-line pt-5">
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <h2 className="font-display text-sm font-extrabold">سجل الطلبات</h2>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          الطلبات المنتهية والمكتملة والملغاة
                        </p>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {historyRequests.length} طلب
                      </span>
                    </div>
                    <div className="space-y-2">
                      {visibleHistoryRequests.map((request) => (
                        <RequestCard
                          key={request.id}
                          request={request}
                          highlighted={search.request === request.id}
                          pending={endRequest.isPending}
                          onEnd={() => setEndRequestId(request.id)}
                        />
                      ))}
                    </div>
                    <PaginationControls
                      page={currentHistoryPage}
                      total={historyRequests.length}
                      pageSize={pageSize}
                      onPageChange={setHistoryRequestsPage}
                    />
                  </section>
                )}
              </div>
            );
          })()
        ) : displayedReceivedOffers.length ? (
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
                contactOpen={openOfferId === offer.id}
                onContactToggle={() =>
                  setOpenOfferId((current) => (current === offer.id ? null : offer.id))
                }
                onStatus={(status) => setOfferStatus.mutate({ id: offer.id, status })}
                highlighted={search.offer === offer.id}
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
            description="عندما يرد مكتب على أحد طلباتك سيظهر العرض هنا."
          />
        )}

        <a
          href="/request"
          className="block w-full rounded-2xl bg-terracotta py-3.5 text-center text-sm font-display font-bold text-background"
        >
          نشر طلب عقاري جديد
        </a>
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
            <p className="mt-1 text-xs leading-5 text-muted-foreground">اختر المكتب الذي أتم الطلب من بين المكاتب التي أرسلت عروضًا عليه.</p>
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
        <span className="min-w-6 rounded-full bg-forest-soft px-2 py-1 text-center text-[10px] font-extrabold text-forest">{total}</span>
      </div>

      {!total && (
        <div className="rounded-2xl bg-surface p-3 text-xs leading-6 text-muted-foreground ring-1 ring-line">
          ستظهر هنا طلبات السوق التي وافقت على عرض مكتب، وطلبات التواصل على العقارات التي وافق عليها المكتب.
        </div>
      )}

      {requests.map((request) => {
        const isCompleted = request.status === "fulfilled";
        const selectedOfferId = isCompleted
          ? request.completed_offer_id || request.accepted_offer_id
          : request.accepted_offer_id;
        const offer = (request.office_offers ?? []).find((item) => item.id === selectedOfferId)
          ?? (request.office_offers ?? []).find((item) => item.id === request.accepted_offer_id);
        const office = offer?.offices;
        const phone = String(office?.phone ?? "").trim();
        const whatsapp = String(office?.whatsapp ?? office?.phone ?? "").trim();
        return (
          <article key={request.id} id={"accepted-request-card-" + request.id}
            className="space-y-3 rounded-2xl bg-surface p-3 ring-2 ring-forest/20">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-display text-sm font-extrabold">
                  {PROPERTY_KINDS.find((kind) => kind.value === request.kind)?.label ?? "عقار"} · {LISTING_TYPES.find((type) => type.value === request.listing)?.label ?? "طلب عقاري"}
                </h3>
                <p className="mt-1 text-[11px] text-muted-foreground">{formatDate(request.created_at)}</p>
              </div>
              <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold",
                isCompleted ? "bg-forest text-background" : "bg-forest-soft text-forest")}>
                {isCompleted ? "تم اكتمال الطلب" : "تم قبول العرض"}
              </span>
            </div>

            {request.attachment_url && (
              <img src={request.attachment_url} alt="صورة الطلب" loading="lazy"
                className="max-h-64 w-full rounded-xl object-cover" />
            )}

            <div className="rounded-xl bg-background p-3 ring-1 ring-line">
              <div className="text-[10px] font-semibold text-muted-foreground">تفاصيل الطلب</div>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{request.description || "لا يوجد وصف إضافي."}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-surface p-2">
                  <div className="text-[10px] text-muted-foreground">الحي</div>
                  <div className="mt-1 font-bold">{request.neighborhood || "أي حي"}</div>
                </div>
                <div className="rounded-lg bg-surface p-2">
                  <div className="text-[10px] text-muted-foreground">الميزانية</div>
                  <div className="mt-1 font-bold">{request.budget_min != null || request.budget_max != null ? formatPrice(request.budget_min) + " - " + formatPrice(request.budget_max) + " ر.س" : "غير محددة"}</div>
                </div>
                <div className="rounded-lg bg-surface p-2">
                  <div className="text-[10px] text-muted-foreground">المساحة</div>
                  <div className="mt-1 font-bold">{request.area_min != null ? "من " + request.area_min + " م²" : "غير محددة"}</div>
                </div>
              </div>
            </div>

            {offer && (offer.message || offer.price != null) && (
              <div className="rounded-xl bg-forest-soft p-3 text-xs leading-5 text-forest">
                <div className="font-extrabold">بيانات العرض</div>
                {offer.message && <p className="mt-1 whitespace-pre-wrap">{offer.message}</p>}
                {offer.price != null && <p className="mt-1 font-extrabold">السعر المقترح: {formatPrice(offer.price)} ر.س</p>}
              </div>
            )}

            <div className="rounded-xl bg-background p-3 ring-1 ring-line">
              <div className="text-[10px] font-semibold text-muted-foreground">بيانات اتصال المكتب</div>
              <div className="mt-1 text-sm font-extrabold">{office?.name || "مكتب عقاري"}</div>
              <div className="mt-1 text-sm" dir="ltr">{phone || "رقم المكتب غير متوفر"}</div>
              {phone && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <a href={"tel:" + phone} className="rounded-xl bg-forest py-2.5 text-center text-xs font-bold text-background">اتصال بالمكتب</a>
                  <a href={whatsappHref(whatsapp || phone, "مرحبًا " + (office?.name || "المكتب العقاري") + "، بخصوص طلبي العقاري")} target="_blank" rel="noreferrer"
                    className="rounded-xl bg-[#25D366]/10 py-2.5 text-center text-xs font-bold text-[#25D366]">واتساب المكتب</a>
                </div>
              )}
            </div>

            {isCompleted ? (
              <div className="rounded-xl bg-forest-soft py-2.5 text-center text-xs font-bold text-forest">تم اكتمال الطلب</div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => onEndRequest(request.id)} disabled={pending}
                  className="rounded-xl bg-terracotta-soft py-2.5 text-xs font-bold text-terracotta disabled:opacity-50">
                  إنهاء الطلب
                </button>
                <button type="button" onClick={() => onCompleteRequest(request.id)} disabled={pending}
                  className="rounded-xl bg-forest py-2.5 text-xs font-bold text-background disabled:opacity-50">
                  تم اكتمال الطلب
                </button>
              </div>
            )}
          </article>
        );
      })}

      {inquiries.map((inquiry) => {
        const phone = String(inquiry.office?.phone ?? "").trim();
        const whatsapp = String(inquiry.office?.whatsapp ?? inquiry.office?.phone ?? "").trim();
        const inquiryLabel: Record<string, string> = { viewing: "معاينة", buy: "شراء", rent: "استئجار", question: "استفسار" };
        return (
          <article key={inquiry.id} id={"accepted-inquiry-card-" + inquiry.id}
            className="space-y-3 rounded-2xl bg-surface p-3 ring-2 ring-forest/20">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-display text-sm font-extrabold">{inquiry.property?.title || "عقار المكتب"}</h3>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {inquiry.property?.property_number ? "رقم العقار: " + inquiry.property.property_number + " · " : ""}
                  {inquiryLabel[inquiry.type] || "طلب تواصل"} · {formatDate(inquiry.created_at)}
                </p>
              </div>
              <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold", inquiry.status === "completed" ? "bg-forest text-background" : "bg-forest-soft text-forest")}>
                {inquiry.status === "completed" ? "تم اكتمال الطلب" : "المكتب وافق على طلبك"}
              </span>
            </div>
            {inquiry.message && <p className="whitespace-pre-wrap rounded-xl bg-background p-3 text-sm leading-5">{inquiry.message}</p>}
            <div className="rounded-xl bg-background p-3 ring-1 ring-line">
              <div className="text-[10px] font-semibold text-muted-foreground">بيانات اتصال المكتب</div>
              <div className="mt-1 text-sm font-extrabold">{inquiry.office?.name || "مكتب عقاري"}</div>
              <div className="mt-1 text-sm" dir="ltr">{phone || "رقم المكتب غير متوفر"}</div>
              {phone && <div className="mt-3 grid grid-cols-2 gap-2">
                <a href={"tel:" + phone} className="rounded-xl bg-forest py-2.5 text-center text-xs font-bold text-background">اتصال بالمكتب</a>
                <a href={whatsappHref(whatsapp || phone, "مرحبًا " + (inquiry.office?.name || "المكتب العقاري") + "، بخصوص طلب التواصل")}
                  target="_blank" rel="noreferrer" className="rounded-xl bg-[#25D366]/10 py-2.5 text-center text-xs font-bold text-[#25D366]">واتساب المكتب</a>
              </div>}
            </div>
            <a href={"/properties/" + encodeURIComponent(inquiry.property_id)}
              className="block rounded-xl bg-background py-2.5 text-center text-xs font-bold text-forest ring-1 ring-line">تفاصيل العقار</a>
            {inquiry.status === "completed" ? (
              <div className="rounded-xl bg-forest-soft py-2.5 text-center text-xs font-bold text-forest">تم اكتمال الطلب</div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => onEndInquiry(inquiry.id)} disabled={pending}
                  className="rounded-xl bg-terracotta-soft py-2.5 text-xs font-bold text-terracotta disabled:opacity-50">إنهاء الطلب</button>
                <button type="button" onClick={() => onCompleteInquiry(inquiry.id)} disabled={pending}
                  className="rounded-xl bg-forest py-2.5 text-xs font-bold text-background disabled:opacity-50">تم اكتمال الطلب</button>
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}

function Tab({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold",
        active ? "bg-forest text-background" : "text-muted-foreground",
      )}
    >
      <span>{label}</span>
      {count > 0 && (
        <span
          className={cn(
            "min-w-5 rounded-full px-1.5 py-0.5 text-[10px] leading-none",
            active ? "bg-background text-forest" : "bg-terracotta text-background",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function RequestCard({
  request, highlighted, pending, onEnd,
}: { request: RequestRow; highlighted: boolean; pending: boolean; onEnd: () => void }) {
  const status = request.status;
  const isActive = status === "active";
  const offerCount = request.office_offers?.length ?? 0;
  const completedOffer = (request.office_offers ?? []).find(
    (offer) => String(offer.id) === String(request.completed_offer_id ?? ""),
  );
  const completedOfficeName =
    completedOffer?.offices?.name ||
    (request.office_offers ?? []).find(
      (offer) => String(offer.offices?.id ?? "") === String(request.completed_office_id ?? ""),
    )?.offices?.name ||
    null;
  return (
    <div id={"request-card-" + request.id} className={cn("rounded-2xl bg-surface p-3 ring-1 ring-line", highlighted && "ring-2 ring-forest")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-display text-sm font-extrabold">
            {PROPERTY_KINDS.find((k) => k.value === request.kind)?.label ?? "عقار"} ·{" "}
            {LISTING_TYPES.find((l) => l.value === request.listing)?.label ?? "طلب"}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {formatDate(request.created_at)}{request.expires_at ? " · ينتهي " + formatDate(request.expires_at) : ""}
          </div>
        </div>
        <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold",
          status === "fulfilled" ? "bg-forest-soft text-forest" :
          status === "cancelled" || status === "ended" ? "bg-terracotta-soft text-terracotta" :
          status === "expired" ? "bg-sand text-muted-foreground" : "bg-forest-soft text-forest")}>
          {REQUEST_STATUS[status] ?? status}
        </span>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-5 text-muted-foreground">{request.description}</p>
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <Info label="الميزانية">{request.budget_min != null || request.budget_max != null ? formatPrice(request.budget_min) + " - " + formatPrice(request.budget_max) + " ر.س" : "غير محددة"}</Info>
        <Info label="المساحة">{request.area_min != null ? "من " + request.area_min + " م²" : "غير محددة"}</Info>
        <Info label="الحي">{request.neighborhood || "أي حي"}</Info>
        <Info label="العروض">{offerCount}</Info>
      </div>
      {isActive && (
        <button type="button" onClick={onEnd} disabled={pending}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-terracotta-soft py-2.5 text-xs font-bold text-terracotta disabled:opacity-50">
          <XCircle className="size-4" /> إنهاء الطلب
        </button>
      )}
      {status === "ended" && request.end_reason && (
        <div className="mt-2 rounded-xl bg-sand p-2.5 text-xs leading-5 text-muted-foreground">سبب الإنهاء: {request.end_reason}</div>
      )}
    </div>
  );
}

function OfferCard({
  offer, pending, contactOpen, onContactToggle, onStatus, highlighted, canMarkComplete, onMarkComplete,
}: {
  offer: OfferRow; pending: boolean; contactOpen: boolean; onContactToggle: () => void;
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
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => onStatus("accepted")} disabled={pending} className="flex items-center justify-center gap-1.5 rounded-xl bg-forest py-2.5 text-xs font-bold text-background disabled:opacity-50"><CheckCircle2 className="size-4" /> قبول العرض</button>
          <button type="button" onClick={() => onStatus("rejected")} disabled={pending} className="flex items-center justify-center gap-1.5 rounded-xl bg-terracotta-soft py-2.5 text-xs font-bold text-terracotta disabled:opacity-50"><XCircle className="size-4" /> رفض</button>
        </div>
      )}
      {canMarkComplete && (
        <div className="mt-2.5 space-y-2 rounded-xl bg-forest-soft p-3">
          <p className="text-xs leading-5 text-forest">بعد إتمام التعامل، اختر المكتب الذي اكتمل الطلب معه.</p>
          <button type="button" onClick={onMarkComplete} disabled={pending} className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-forest py-2.5 text-xs font-bold text-background disabled:opacity-50"><CheckCircle2 className="size-4" /> الطلب مكتمل</button>
        </div>
      )}
      {offer.status === "ended" && <p className="mt-2.5 rounded-xl bg-terracotta-soft p-3 text-xs leading-5 text-terracotta">{offer.end_reason ? "ألغى المكتب عرضه. سبب الإلغاء: " + offer.end_reason : "انتهى هذا العرض لأن الطلب لم يعد متاحًا للتقديم عليه."}</p>}
      {offer.status === "completed" && <p className="mt-2.5 rounded-xl bg-forest-soft p-3 text-xs leading-5 text-forest">تم تسجيل هذا المكتب باعتباره المكتب الذي اكتمل الطلب من خلاله.</p>}
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <button type="button" onClick={(event) => { event.stopPropagation(); onContactToggle(); }} aria-expanded={contactOpen} aria-label="عرض رقم الاتصال" title="اتصال"
          className={cn("grid size-10 place-items-center rounded-xl ring-1 ring-line", contactOpen ? "bg-forest-soft text-forest" : "bg-surface text-forest")}><Phone className="size-4" /></button>
        <a href={whatsappHref(office?.whatsapp || office?.phone, "مرحبًا، بخصوص العرض الذي أرسلتموه على طلبي العقاري")} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} aria-label="واتساب" title="واتساب" className="grid size-10 place-items-center rounded-xl bg-[#25D366]/10 text-[#25D366]"><WhatsAppIcon className="size-5 text-[#25D366]" /></a>
      </div>
      {contactOpen && (
        <div className="mt-2 rounded-2xl bg-background p-3 ring-1 ring-line">
          <div className="text-[10px] font-semibold text-muted-foreground">رقم الاتصال الذي أضافه المكتب</div>
          <div className="mt-1 flex items-center gap-2"><div className="min-w-0 flex-1 text-sm font-extrabold" dir="ltr">{office?.phone || "المكتب لم يضع رقم الاتصال"}</div>
            {office?.phone && <button type="button" onClick={async (event) => {
              event.stopPropagation();
              try {
                if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(office.phone!);
                else {
                  const input = document.createElement("textarea"); input.value = office.phone!;
                  input.setAttribute("readonly", ""); input.style.position = "fixed"; input.style.opacity = "0";
                  document.body.appendChild(input); input.select(); const copied = document.execCommand("copy"); document.body.removeChild(input);
                  if (!copied) throw new Error("copy_failed");
                }
                toast.success("تم نسخ رقم الاتصال");
              } catch { toast.error("تعذّر نسخ رقم الاتصال"); }
            }} className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface text-forest ring-1 ring-line" aria-label="نسخ رقم الاتصال" title="نسخ الرقم"><Copy className="size-4" /></button>}
          </div>
        </div>
      )}
    </div>
  );
}

function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("fill-current", className)}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.198.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.075-.792.372-.273.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.077 4.487.71.307 1.263.49 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.268c.001-5.45 4.436-9.884 9.888-9.884a9.83 9.83 0 0 1 6.988 2.898 9.83 9.83 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.89a11.86 11.86 0 0 0 1.595 5.946L.057 24l6.304-1.655a11.88 11.88 0 0 0 5.684 1.448h.005c6.554 0 11.89-5.335 11.893-11.89a11.821 11.821 0 0 0-3.479-8.415" />
    </svg>
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
