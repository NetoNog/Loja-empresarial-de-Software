import 'server-only';
import mysql, { type RowDataPacket } from 'mysql2/promise';

/**
 * Integração com ITOM/ITAM para instalação remota (push de pacote na máquina do usuário).
 * Opcional: habilite com ITOM_ENABLED=true e configure as variáveis ITOM_*.
 */
export const itomEnabled = process.env.ITOM_ENABLED === 'true';

export type ItomHost = { HostName: string; SystemID: number; IPAddress: string; UserName: string | null };

let pool: mysql.Pool | null = null;
function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.ITOM_MYSQL_HOST,
      port: Number(process.env.ITOM_MYSQL_PORT ?? 3306),
      database: process.env.ITOM_MYSQL_DATABASE,
      user: process.env.ITOM_MYSQL_USER,
      password: process.env.ITOM_MYSQL_PASSWORD,
      connectionLimit: 5,
      connectTimeout: 5000,
    });
  }
  return pool;
}

/** Máquinas gerenciadas associadas ao IP do solicitante (query parametrizada). */
export async function getHostsByIp(ip: string): Promise<ItomHost[]> {
  if (!itomEnabled || !/^[0-9a-fA-F:.]{3,45}$/.test(ip)) return [];
  const [rows] = await getPool().execute<RowDataPacket[]>(
    `SELECT i.HostName, i.SystemID, i.IPAddress, o.UserName
       FROM ims.inventorymaster i
       LEFT JOIN ims.computersystem o ON o.SystemID = i.SystemID
      WHERE i.ManageNode = 1 AND i.DeviceCategoryID != -1 AND i.IPAddress = ?
      GROUP BY i.SystemID, o.UserName`,
    [ip],
  );
  return rows as ItomHost[];
}

function xmlEscape(v: string | number) {
  return String(v).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!);
}

/** Dispara job de instalação de software no ITAM (SOAP PostSWJob). */
export async function postSoftwareJob(packageId: number, systemId: number): Promise<void> {
  const url = process.env.ITOM_AUTOMATION_URL;
  if (!url) throw new Error('ITOM_AUTOMATION_URL não configurada');
  const body = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:aut="http://automation.tkd.com/">
  <soapenv:Header/>
  <soapenv:Body>
    <aut:PostSWJob>
      <nSiteID>${xmlEscape(process.env.ITOM_SITE_ID ?? '1')}</nSiteID>
      <nJobPriority>3000</nJobPriority>
      <JobInfo><strKey>SWPKGID</strKey><strValue>${xmlEscape(packageId)}</strValue></JobInfo>
      <SystemIDLIST>${xmlEscape(systemId)}</SystemIDLIST>
    </aut:PostSWJob>
  </soapenv:Body>
</soapenv:Envelope>`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    body,
    signal: AbortSignal.timeout(15000),
  });
  const text = await res.text();
  if (!res.ok || /<soap:Fault|<faultstring/i.test(text)) {
    throw new Error(`ITAM respondeu ${res.status}`);
  }
}
