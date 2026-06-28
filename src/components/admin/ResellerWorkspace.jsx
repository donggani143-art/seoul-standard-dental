'use client';

import AdminShell from '@/components/admin/AdminShell';
import { BillingsModule } from '@/components/admin/SuperAdminWorkspace';
import SalesWorkspace from '@/components/admin/SalesWorkspace';
import ResellerApiInfo from '@/components/admin/ResellerApiInfo';

export default function ResellerWorkspace({ session, activeModule, assignments, billings, hospitals }) {
  const normalizedHospitals = Array.isArray(hospitals) ? hospitals : (assignments || []).map((a) => ({
    id: a.hospital_id,
    name: a.hospital_name,
    slug: a.hospital_slug,
    status: a.hospital_status,
  }));

  function renderModule() {
    if (activeModule === 'sales') {
      return <SalesWorkspace />;
    }
    if (activeModule === 'apiinfo') {
      return <ResellerApiInfo />;
    }
    return (
      <BillingsModule
        session={session}
        billings={Array.isArray(billings) ? billings : []}
        hospitals={normalizedHospitals}
      />
    );
  }

  return (
    <AdminShell
      session={session}
      activeModule={activeModule}
      hospitalName="리셀러"
    >
      {renderModule()}
    </AdminShell>
  );
}
