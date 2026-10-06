//#region node_modules/.nitro/vite/services/ssr/assets/constants-Bvy1nlDs.js
var PROPERTY_KINDS = [
	{
		value: "land",
		label: "أرض",
		plural: "أراضي"
	},
	{
		value: "villa",
		label: "فيلا",
		plural: "فلل"
	},
	{
		value: "apartment",
		label: "شقة",
		plural: "شقق"
	},
	{
		value: "farm",
		label: "مزرعة",
		plural: "مزارع"
	},
	{
		value: "rest_house",
		label: "استراحة",
		plural: "استراحات"
	},
	{
		value: "building",
		label: "عمارة",
		plural: "عمائر"
	},
	{
		value: "shop",
		label: "محل",
		plural: "محلات"
	}
];
var LISTING_TYPES = [{
	value: "sale",
	label: "للبيع"
}, {
	value: "rent",
	label: "للإيجار"
}];
var PROPERTY_STATES = [
	{
		value: "available",
		label: "متاح"
	},
	{
		value: "reserved",
		label: "محجوز"
	},
	{
		value: "sold",
		label: "مباع"
	},
	{
		value: "rented",
		label: "مؤجر"
	}
];
var FACINGS = [
	"شمال",
	"جنوب",
	"شرق",
	"غرب",
	"شارعين",
	"زاوية"
];
var BOOKING_STATUS = {
	pending: "بانتظار الموافقة",
	accepted: "مقبول",
	rejected: "مرفوض",
	completed: "مكتمل",
	cancelled: "ملغي"
};
var REQUEST_STATUS = {
	active: "نشط",
	expired: "منتهي",
	cancelled: "ملغي",
	fulfilled: "مكتمل"
};
var VERIFICATION_STATUS = {
	pending: "قيد المراجعة",
	verified: "موثق",
	rejected: "مرفوض"
};
function kindLabel(value) {
	return PROPERTY_KINDS.find((k) => k.value === value)?.label ?? "—";
}
function listingLabel(value) {
	return LISTING_TYPES.find((k) => k.value === value)?.label ?? "—";
}
function stateLabel(value) {
	return PROPERTY_STATES.find((k) => k.value === value)?.label ?? "—";
}
var QUICK_KINDS = PROPERTY_KINDS.filter((k) => [
	"land",
	"villa",
	"apartment",
	"farm",
	"rest_house",
	"building"
].includes(k.value));
var RENT_PERIODS = [
	{
		value: "yearly",
		label: "سنوي"
	},
	{
		value: "monthly",
		label: "شهري"
	},
	{
		value: "daily",
		label: "يومي"
	}
];
function rentPeriodLabel(value) {
	return RENT_PERIODS.find((p) => p.value === value)?.label ?? "سنوي";
}
var INQUIRY_TYPES = [
	{
		value: "viewing",
		label: "أرغب بمعاينة العقار",
		short: "معاينة"
	},
	{
		value: "buy",
		label: "أرغب بالشراء",
		short: "شراء"
	},
	{
		value: "rent",
		label: "أرغب بالاستئجار",
		short: "استئجار"
	},
	{
		value: "question",
		label: "لدي استفسار",
		short: "استفسار"
	}
];
function inquiryTypeLabel(value) {
	return INQUIRY_TYPES.find((t) => t.value === value)?.short ?? "طلب";
}
var INQUIRY_STATUSES = [
	{
		value: "new",
		label: "جديد"
	},
	{
		value: "contacted",
		label: "تم التواصل"
	},
	{
		value: "scheduled",
		label: "موعد معاينة"
	},
	{
		value: "completed",
		label: "مكتمل"
	},
	{
		value: "closed",
		label: "مغلق"
	}
];
function inquiryStatusLabel(value) {
	return INQUIRY_STATUSES.find((s) => s.value === value)?.label ?? "—";
}
//#endregion
export { LISTING_TYPES as a, REQUEST_STATUS as c, inquiryTypeLabel as d, kindLabel as f, stateLabel as h, INQUIRY_TYPES as i, VERIFICATION_STATUS as l, rentPeriodLabel as m, FACINGS as n, PROPERTY_KINDS as o, listingLabel as p, INQUIRY_STATUSES as r, QUICK_KINDS as s, BOOKING_STATUS as t, inquiryStatusLabel as u };
