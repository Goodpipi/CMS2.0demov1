import { cn } from '@/app/components/ui/utils';

interface BrandLogoProps {
  className?: string;
  onClick?: () => void;
}

export function BrandLogo({ className, onClick }: BrandLogoProps) {
  const content = (
    <>
      <span className="brand-logo-mark" aria-hidden>
        <img src="/brand-logo-mark.png" alt="" draggable={false} />
      </span>
      <span className="brand-logo-divider" aria-hidden />
      <span className="brand-logo-copy">
        <span className="brand-logo-title">
          <span className="brand-logo-title-dark">Content</span>{' '}
          <span className="brand-logo-title-gradient">Studio</span>
        </span>
        <span className="brand-logo-zh">智能内容生成平台</span>
        <span className="brand-logo-en">AI-POWERED CONTENT STUDIO</span>
      </span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={cn('brand-logo', className)}
        onClick={onClick}
        aria-label="Content Studio 首页"
      >
        {content}
      </button>
    );
  }

  return (
    <div className={cn('brand-logo', className)} aria-label="Content Studio">
      {content}
    </div>
  );
}
