import { Cloud, FilePlus2, FolderOpen, X } from 'lucide-react';

interface CreationMethodModalProps {
  open: boolean;
  onClose: () => void;
  onCreateNew: () => void;
  onOpenLocal: (file: File) => void;
  onOpenCms: () => void;
}

const options = [
  {
    id: 'new',
    title: '创建新内容',
    description: '从当前创作需求开始，进入任务详情页',
    Icon: FilePlus2,
    tone: 'from-[#54B9F9] to-[#3BA6E8]',
  },
  {
    id: 'local',
    title: '打开本地文件',
    description: '选择任意文件后，打开内置 Mock PPT 预览',
    Icon: FolderOpen,
    tone: 'from-[#6FBD1F] to-[#54B9F9]',
  },
  {
    id: 'cms',
    title: '打开 CMS 文件',
    description: '从已审批的 CMS 内容中选择文件',
    Icon: Cloud,
    tone: 'from-[#8AD329] to-[#6FBD1F]',
  },
] as const;

export function CreationMethodModal({
  open,
  onClose,
  onCreateNew,
  onOpenLocal,
  onOpenCms,
}: CreationMethodModalProps) {
  if (!open) return null;

  const handleLocalFileSelected = (event: React.FormEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    onOpenLocal(file);
    input.value = '';
  };

  const handleLocalPickerOpened = (event: React.MouseEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    window.addEventListener(
      'focus',
      () => {
        window.setTimeout(() => {
          const file = input.files?.[0];
          if (!file) return;
          onOpenLocal(file);
          input.value = '';
        }, 100);
      },
      { once: true }
    );
  };

  const actions = {
    new: onCreateNew,
    cms: onOpenCms,
  };

  return (
    <div
      className="modal-bg creation-method-modal-bg show"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal w-[min(720px,calc(100vw-32px))] max-w-none rounded-3xl p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[20px] font-semibold tracking-tight text-foreground">选择创作方式</h3>
            <p className="mt-1.5 text-[12.5px] text-muted-foreground">
              新建任务，或打开已有文件继续创作
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full border border-border/70 text-muted-foreground transition hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
            aria-label="关闭"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {options.map(({ id, title, description, Icon, tone }) => {
            const content = (
              <>
              <span
                className={`mb-4 grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${tone} text-white shadow-[0_6px_14px_-7px_rgba(59, 150, 210,0.8)] ring-1 ring-white/40`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="block text-[13.5px] font-semibold text-foreground">{title}</span>
              <span className="mt-1.5 block text-[11px] leading-relaxed text-muted-foreground">
                {description}
              </span>
              </>
            );
            const className =
              'group cursor-pointer rounded-2xl glass-card p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';
            return id === 'local' ? (
              <label key={id} className={`${className} relative overflow-hidden`}>
                {content}
                <input
                  type="file"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  aria-label="选择要打开的本地文件"
                  onClick={handleLocalPickerOpened}
                  onInput={handleLocalFileSelected}
                  onChange={handleLocalFileSelected}
                />
              </label>
            ) : (
              <button key={id} type="button" onClick={actions[id]} className={className}>
                {content}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
