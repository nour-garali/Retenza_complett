import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ notifications: [] }, { status: 401 });
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const notifs: any[] = [];
  const now = new Date();

  const timeAgo = (date: string) => {
    const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 60000);
    if (diff < 60) return `il y a ${diff} min`;
    if (diff < 1440) return `il y a ${Math.floor(diff / 60)}h`;
    return `il y a ${Math.floor(diff / 1440)}j`;
  };

  try {
    const [partnershipsRes, incidentsRes, supportRes] = await Promise.all([
      fetch(`${API_URL}/admin/partnership-requests?status=PENDING&limit=5`, { headers, cache: 'no-store' }),
      fetch(`${API_URL}/admin/incidents?limit=5`, { headers, cache: 'no-store' }),
      fetch(`${API_URL}/admin/support-requests?limit=5`, { headers, cache: 'no-store' }),
    ]);

    if (partnershipsRes.ok) {
      const data = await partnershipsRes.json();
      (data.data?.requests || []).slice(0, 3).forEach((req: any) => {
        notifs.push({
          id: `partnership-${req._id}`,
          type: 'partnership',
          title: 'Nouvelle demande de partenariat',
          message: `${req.businessName} — ${req.category}`,
          time: timeAgo(req.createdAt),
          read: false,
          link: '/admin/partenaires',
        });
      });
    }

    if (incidentsRes.ok) {
      const data = await incidentsRes.json();
      (data.data?.incidents || []).filter((i: any) => i.status !== 'resolved').slice(0, 2).forEach((inc: any) => {
        notifs.push({
          id: `incident-${inc._id}`,
          type: 'incident',
          title: 'Incident signalé',
          message: inc.title || inc.description?.slice(0, 50) || 'Nouvel incident',
          time: timeAgo(inc.createdAt),
          read: false,
          link: '/admin',
        });
      });
    }

    if (supportRes.ok) {
      const data = await supportRes.json();
      (data.data?.requests || []).filter((r: any) => r.status !== 'closed').slice(0, 2).forEach((req: any) => {
        notifs.push({
          id: `support-${req._id}`,
          type: 'support',
          title: 'Ticket support ouvert',
          message: req.subject || "Demande d'assistance",
          time: timeAgo(req.createdAt),
          read: false,
          link: '/admin',
        });
      });
    }
  } catch {
    // Backend unreachable — return empty so client uses demo
  }

  return NextResponse.json({ notifications: notifs });
}
