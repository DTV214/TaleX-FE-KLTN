import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleHelp,
  FileText,
  Flag,
  LifeBuoy,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";

const guideSections = [
  {
    title: "Quản lý người dùng",
    description:
      "Theo dõi tài khoản, vai trò, trạng thái khóa và các thao tác hỗ trợ cộng đồng.",
    icon: Users,
    items: [
      "Dùng ô tìm kiếm để tra nhanh theo tên, email hoặc username.",
      "Lọc theo vai trò và trạng thái trước khi thực hiện thao tác khóa/mở khóa.",
      "Không xử lý tài khoản Admin nếu chưa có phân quyền và lý do rõ ràng.",
    ],
  },
  {
    title: "Nội dung & kiểm duyệt",
    description:
      "Quản lý series, báo cáo vi phạm, ticket moderation và khiếu nại.",
    icon: ShieldCheck,
    items: [
      "Ưu tiên xử lý ticket có nhiều report hoặc điểm ưu tiên cao.",
      "Kiểm tra ảnh minh chứng và nội dung liên quan trước khi đưa ra hình phạt.",
      "Nếu ticket chưa chắc chắn, dùng hướng bác bỏ report thay vì tạo penalty.",
    ],
  },
  {
    title: "Tài chính creator",
    description:
      "Theo dõi quyết toán, thuế, tỷ lệ chia sẻ doanh thu và lịch sử payout.",
    icon: Wallet,
    items: [
      "Đối chiếu settlement theo tháng trước khi chuyển trạng thái xử lý.",
      "Kiểm tra cấu hình thuế và creator config trước các kỳ quyết toán lớn.",
      "Không chạy thao tác thủ công nhiều lần nếu chưa xác nhận kết quả từ BE.",
    ],
  },
  {
    title: "Cấu hình vận hành",
    description:
      "Các trang cấu hình hệ thống chỉ dùng khi có API thật và quyền quản trị phù hợp.",
    icon: Settings,
    items: [
      "Không bật/tắt tính năng đang trong giai đoạn phát triển.",
      "Giữ theme Admin/Staff đồng bộ để dễ rà soát giao diện.",
      "Khi cần thêm API mới, kiểm tra contract BE trước khi nối vào FE.",
    ],
  },
];

const quickFlows = [
  "Kiểm tra dữ liệu trong danh sách trước.",
  "Mở chi tiết để xem đầy đủ context.",
  "Thực hiện thao tác xử lý nếu đủ quyền.",
  "Tải lại danh sách và xác nhận trạng thái mới.",
];

const supportCards = [
  {
    title: "Báo cáo lỗi giao diện",
    text: "Ghi lại route, theme đang dùng, ảnh chụp màn hình và thao tác dẫn tới lỗi.",
    icon: Flag,
  },
  {
    title: "Yêu cầu nối API",
    text: "Chuẩn bị endpoint, method, payload, response mẫu và quyền truy cập cần thiết.",
    icon: FileText,
  },
  {
    title: "Hướng dẫn thao tác",
    text: "Mô tả vai trò người dùng, màn hình cần hỗ trợ và kết quả mong muốn.",
    icon: CircleHelp,
  },
];

export default function AdminSupportPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))]">
        <div className="grid gap-8 p-6 md:grid-cols-[1.25fr_0.75fr] md:p-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-amber-700 backoffice-dark:border-[var(--backoffice-primary)]/35 backoffice-dark:bg-[var(--backoffice-primary)]/10 backoffice-dark:text-[var(--backoffice-primary)]">
              <LifeBuoy className="h-4 w-4" />
              Trung tâm hỗ trợ
            </span>
            <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 backoffice-dark:text-white md:text-5xl">
              Hướng dẫn quản trị TaleX
            </h1>
            <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-slate-500 backoffice-dark:text-white/60 md:text-base">
              Trang này tổng hợp các nguyên tắc thao tác nhanh cho Admin/Staff:
              cách rà soát dữ liệu, xử lý người dùng, kiểm duyệt nội dung và
              phối hợp với BE khi cần mở luồng mới.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 backoffice-dark:border-white/10 backoffice-dark:bg-black/25">
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-white p-3 text-amber-600 shadow-sm backoffice-dark:bg-black backoffice-dark:text-[var(--backoffice-primary)]">
                <BookOpen className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-black text-slate-950 backoffice-dark:text-white">
                  Quy trình thao tác chuẩn
                </p>
                <p className="text-xs font-semibold text-slate-500 backoffice-dark:text-white/50">
                  Dùng cho các trang quản trị quan trọng
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {quickFlows.map((flow, index) => (
                <div
                  key={flow}
                  className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 backoffice-dark:border-white/10 backoffice-dark:bg-[#0b0b0d]"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white backoffice-dark:bg-[var(--backoffice-primary)] backoffice-dark:text-black">
                    {index + 1}
                  </span>
                  <p className="text-sm font-bold leading-6 text-slate-700 backoffice-dark:text-white/75">
                    {flow}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {guideSections.map((section) => {
          const Icon = section.icon;

          return (
            <article
              key={section.title}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]"
            >
              <div className="flex items-start gap-4">
                <span className="rounded-2xl bg-slate-100 p-3 text-slate-700 backoffice-dark:bg-black/40 backoffice-dark:text-[var(--backoffice-primary)]">
                  <Icon className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="text-xl font-black text-slate-950 backoffice-dark:text-white">
                    {section.title}
                  </h2>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-500 backoffice-dark:text-white/55">
                    {section.description}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {section.items.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 backoffice-dark:text-emerald-300" />
                    <p className="text-sm font-semibold leading-6 text-slate-600 backoffice-dark:text-white/70">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 backoffice-dark:border-white/10 backoffice-dark:bg-black/25">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-950 backoffice-dark:text-white">
              Khi cần hỗ trợ thêm
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500 backoffice-dark:text-white/55">
              Chuẩn bị đủ thông tin sẽ giúp team xử lý nhanh và tránh ảnh hưởng
              tới các luồng khác.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {supportCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 backoffice-dark:border-white/10 backoffice-dark:bg-[#0b0b0d]"
              >
                <Icon className="h-6 w-6 text-amber-600 backoffice-dark:text-[var(--backoffice-primary)]" />
                <h3 className="mt-4 text-base font-black text-slate-950 backoffice-dark:text-white">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 backoffice-dark:text-white/60">
                  {card.text}
                </p>
                <div className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-400 backoffice-dark:text-white/35">
                  Ghi chú rõ ràng
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
