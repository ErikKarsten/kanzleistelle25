import { useEffect, useState } from 'react';
import { getLeadtableKunden, getLeadtableKampagnen } from '@/lib/leadtable';

export default function LeadtableWidget() {
  const [kunden, setKunden] = useState<any[]>([]);
  const [kampagnen, setKampagnen] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getLeadtableKunden(), getLeadtableKampagnen('')])
      .then(([k, c]) => { setKunden(k); setKampagnen(c); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (!kunden.length && !kampagnen.length) return null;

  return (
    <div className="grid grid-cols-2 gap-4 mt-4">
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold text-lg mb-3">Leadtable Kunden ({kunden.length})</h3>
        {kunden.slice(0, 5).map((k: any) => (
          <div key={k.id} className="py-2 border-b last:border-0 text-sm">
            {k.name || k.company_name || 'Unbekannt'}
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold text-lg mb-3">Kampagnen ({kampagnen.length})</h3>
        {kampagnen.slice(0, 5).map((c: any) => (
          <div key={c.id} className="py-2 border-b last:border-0 text-sm">
            {c.name}
          </div>
        ))}
      </div>
    </div>
  );
}