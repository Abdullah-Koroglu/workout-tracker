import { Award, GraduationCap, Globe, Clock, Users, ShieldCheck, HelpCircle, Video } from "lucide-react";

interface Certification { name: string; issuer?: string; year?: number; url?: string }
interface EducationItem { school: string; degree?: string; year?: number }
interface FAQ { q: string; a: string }
interface BeforeAfter { clientName?: string; beforeUrl: string; afterUrl: string; description?: string; durationWeeks?: number }

interface Props {
  videoIntroUrl?: string | null;
  languages?: string[] | null;
  certifications?: Certification[] | null;
  education?: EducationItem[] | null;
  hourlyRate?: number | null;
  responseTimeHours?: number | null;
  totalClientsHelped?: number | null;
  beforeAfterStories?: BeforeAfter[] | null;
  faqs?: FAQ[] | null;
  isVerified?: boolean;
  isAcceptingClients?: boolean;
}

function pickVideoEmbed(url: string): string | null {
  // YouTube
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

const cardCls = "rounded-2xl bg-white p-5 border border-slate-100";

export function CoachExtendedInfo({
  videoIntroUrl,
  languages,
  certifications,
  education,
  hourlyRate,
  responseTimeHours,
  totalClientsHelped,
  faqs,
  isVerified,
  isAcceptingClients,
}: Props) {
  const hasAny =
    videoIntroUrl ||
    (languages && languages.length) ||
    (certifications && certifications.length) ||
    (education && education.length) ||
    hourlyRate != null ||
    responseTimeHours != null ||
    totalClientsHelped != null ||
    (faqs && faqs.length);

  if (!hasAny && !isVerified && isAcceptingClients !== false) return null;

  const embed = videoIntroUrl ? pickVideoEmbed(videoIntroUrl) : null;

  return (
    <div className="space-y-4">
      {(isVerified || isAcceptingClients === false) && (
        <div className="flex flex-wrap items-center gap-2">
          {isVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" /> Doğrulanmış Koç
            </span>
          )}
          {isAcceptingClients === false && (
            <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-black text-rose-600">
              Şu an yeni müşteri kabul etmiyor
            </span>
          )}
        </div>
      )}

      {(hourlyRate != null || responseTimeHours != null || totalClientsHelped != null) && (
        <div className="grid grid-cols-3 gap-2">
          {hourlyRate != null && (
            <div className={cardCls}>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Saatlik</p>
              <p className="mt-1 text-lg font-black text-emerald-600">
                {hourlyRate.toLocaleString("tr-TR")} ₺
              </p>
            </div>
          )}
          {responseTimeHours != null && (
            <div className={cardCls}>
              <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <Clock className="h-3 w-3" /> Yanıt
              </p>
              <p className="mt-1 text-lg font-black text-orange-500">~{responseTimeHours}sa</p>
            </div>
          )}
          {totalClientsHelped != null && (
            <div className={cardCls}>
              <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <Users className="h-3 w-3" /> Danışan
              </p>
              <p className="mt-1 text-lg font-black text-indigo-500">{totalClientsHelped}+</p>
            </div>
          )}
        </div>
      )}

      {videoIntroUrl && (
        <div className={cardCls}>
          <div className="mb-3 flex items-center gap-2">
            <Video className="h-4 w-4 text-orange-500" />
            <h3 className="text-sm font-black text-slate-800">Tanıtım Videosu</h3>
          </div>
          {embed ? (
            <div className="aspect-video overflow-hidden rounded-xl">
              <iframe src={embed} allowFullScreen className="h-full w-full" />
            </div>
          ) : (
            <a href={videoIntroUrl} target="_blank" className="text-sm text-orange-600 underline">
              {videoIntroUrl}
            </a>
          )}
        </div>
      )}

      {languages && languages.length > 0 && (
        <div className={cardCls}>
          <div className="mb-2 flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-500" />
            <h3 className="text-sm font-black text-slate-800">Diller</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {languages.map((l) => (
              <span key={l} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-600">
                {l}
              </span>
            ))}
          </div>
        </div>
      )}

      {certifications && certifications.length > 0 && (
        <div className={cardCls}>
          <div className="mb-3 flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-black text-slate-800">Sertifikalar</h3>
          </div>
          <ul className="space-y-1.5">
            {certifications.map((c, i) => (
              <li key={i} className="text-sm text-slate-700">
                <span className="font-bold">{c.name}</span>
                {c.issuer && <span className="text-slate-500"> · {c.issuer}</span>}
                {c.year && <span className="text-slate-400"> ({c.year})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {education && education.length > 0 && (
        <div className={cardCls}>
          <div className="mb-3 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-black text-slate-800">Eğitim</h3>
          </div>
          <ul className="space-y-1.5">
            {education.map((e, i) => (
              <li key={i} className="text-sm text-slate-700">
                <span className="font-bold">{e.school}</span>
                {e.degree && <span className="text-slate-500"> · {e.degree}</span>}
                {e.year && <span className="text-slate-400"> ({e.year})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {faqs && faqs.length > 0 && (
        <div className={cardCls}>
          <div className="mb-3 flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-pink-500" />
            <h3 className="text-sm font-black text-slate-800">Sıkça Sorulan Sorular</h3>
          </div>
          <div className="space-y-2">
            {faqs.map((f, i) => (
              <details key={i} className="group rounded-xl bg-slate-50 p-3">
                <summary className="cursor-pointer text-sm font-bold text-slate-700 list-none">
                  {f.q}
                </summary>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
