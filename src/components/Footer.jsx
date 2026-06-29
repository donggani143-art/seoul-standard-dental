import { getGeoSettings } from '@/lib/seo';

const text = {
  clinic: '\uC11C\uC6B8\uC815\uC11D\uCE58\uACFC',
  promise: '\uC815\uD655\uD55C \uC9C4\uB2E8\uACFC \uD544\uC694\uD55C \uCE58\uB8CC\uB97C \uC6B0\uC120\uD558\uB294 \uC815\uC11D \uC9C4\uB8CC\uB97C \uC57D\uC18D\uD569\uB2C8\uB2E4.',
  hours: '\uC9C4\uB8CC\uC2DC\uAC04',
  weekday: '\uD3C9\uC77C 09:30 - 18:30',
  representative: '\uB300\uD45C\uC790\uBA85',
  director: '\uAE40\uC9C4\uC11D',
  clinicNameLabel: '\uC758\uB8CC\uAE30\uAD00\uBA85',
  clinicName: '\uC11C\uC6B8\uC815\uC11D\uCE58\uACFC\uC758\uC6D0',
  phone: '\uB300\uD45C\uC804\uD654',
  addressLabel: '\uC624\uC2DC\uB294\uAE38',
  address: '\uC778\uCC9C\uAD11\uC5ED\uC2DC \uACC4\uC591\uAD6C \uACC4\uC591\uB300\uB85C 102, 3\uCE35 (\uC791\uC804\uB3D9)',
};

export default async function Footer() {
  const geo = await getGeoSettings();

  return (
    <footer className="bg-zinc-50 border-t border-zinc-200/50 mt-32 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-offblack mb-4">{text.clinic}</h3>
            <p className="text-zinc-500 max-w-[35ch] leading-relaxed">{text.promise}</p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-zinc-500">
            <p><strong className="text-offblack">{text.hours}</strong> {geo?.opening_hours || text.weekday}</p>
            <p><strong className="text-offblack">{text.representative}</strong> {geo?.representative || text.director}</p>
            <p><strong className="text-offblack">{text.clinicNameLabel}</strong> {geo?.clinic_name || text.clinicName}</p>
            <p><strong className="text-offblack">{text.phone}</strong> {geo?.telephone || '032-213-2828'}</p>
            <p><strong className="text-offblack">{text.addressLabel}</strong> {geo?.address || text.address}</p>
          </div>
        </div>
        <div className="text-center text-zinc-400 text-sm pt-8 border-t border-zinc-200">
          <p>&copy; {new Date().getFullYear()} {text.clinicName}. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
