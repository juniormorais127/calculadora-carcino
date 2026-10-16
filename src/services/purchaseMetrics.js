export const ADMIN_UID = 'Dc2sEKML8Lc66cgj8VvSX4Uhhpk1';
export const isAdmin = user => user?.uid === ADMIN_UID;
export const EVENT_LABELS = { view: 'Acesso à aba', brand: 'Interesse em marca', whatsapp: 'WhatsApp', phone: 'Ligação', product: 'Interesse em produto' };
export function summarizeEvents(events) {
  const views = events.filter(e => e.kind === 'view');
  const contacts = events.filter(e => ['whatsapp', 'phone'].includes(e.kind));
  const interests = events.filter(e => e.kind !== 'view');
  const unique = list => new Set(list.map(e => e.uid)).size;
  const groups = new Map();
  for (const event of interests) {
    const key = `${event.kind}:${event.targetId}`;
    if (!groups.has(key)) groups.set(key, { key, kind: event.kind, name: event.targetName, category: event.category, clicks: 0, users: new Set() });
    const row = groups.get(key); row.clicks++; row.users.add(event.uid);
  }
  const days = new Map();
  for (const event of events) {
    const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Fortaleza', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(event.occurredAt));
    if (!days.has(day)) days.set(day, { day, views: 0, interests: 0 });
    days.get(day)[event.kind === 'view' ? 'views' : 'interests']++;
  }
  return { views: views.length, visitors: unique(views), interests: interests.length, interested: unique(interests), contacts: contacts.length, contacting: unique(contacts), rows: [...groups.values()].map(row => ({ ...row, users: row.users.size })).sort((a, b) => b.clicks - a.clicks), days: [...days.values()].sort((a, b) => a.day.localeCompare(b.day)) };
}
export function periodBounds(from, to) {
  return { start: Date.parse(`${from}T00:00:00-03:00`), end: Date.parse(`${to}T23:59:59.999-03:00`) };
}
