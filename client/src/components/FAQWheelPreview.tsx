import React, { memo, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  HelpCircle,
  Loader,
  RotateCw,
  Search,
  Sparkles,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { FAQCategory, FAQCategoryFilter, ItemPosition, useFAQWheel } from '../hooks/useFAQWheel';
import { FAQItem } from '@/services/faqService';
import { cn } from '@/lib/utils';

interface FAQItemCardProps {
  item: FAQItem;
  position: ItemPosition;
  onClick: () => void;
  onPreview: () => void;
  onFocusCard: () => void;
  isFocused: boolean;
  index: number;
  isMobile?: boolean;
}

interface FAQModalProps {
  item: FAQItem;
  onClose: () => void;
}

type CategoryMeta = {
  label: string;
  eyebrow: string;
  Icon: LucideIcon;
  border: string;
  rail: string;
  chip: string;
  iconWrap: string;
};

const categoryMeta: Record<FAQCategory, CategoryMeta> = {
  'job-seekers': {
    label: 'Job seekers',
    eyebrow: 'Candidate help',
    Icon: Users,
    border: 'border-[#1a8fd8]/50 hover:border-[#1a8fd8]',
    rail: 'bg-[#1a8fd8]',
    chip: 'bg-[#e8f5ff] text-[#105a88] ring-[#b8ddf5]',
    iconWrap: 'bg-[#e8f5ff] text-[#126da5]',
  },
  employers: {
    label: 'Employers',
    eyebrow: 'Hiring help',
    Icon: Building2,
    border: 'border-[#7c4dff]/40 hover:border-[#6f42e8]',
    rail: 'bg-[#7c4dff]',
    chip: 'bg-[#f0ebff] text-[#4b2ca0] ring-[#d6c8ff]',
    iconWrap: 'bg-[#f0ebff] text-[#6440c8]',
  },
  general: {
    label: 'General',
    eyebrow: 'Platform basics',
    Icon: CircleHelp,
    border: 'border-[#f2c94c]/70 hover:border-[#dfa900]',
    rail: 'bg-[#f2c94c]',
    chip: 'bg-[#fff6d8] text-[#765900] ring-[#f4dc7a]',
    iconWrap: 'bg-[#fff6d8] text-[#876500]',
  },
};

const filterLabels: Record<FAQCategoryFilter, { label: string; Icon: LucideIcon }> = {
  all: { label: 'All', Icon: Search },
  'job-seekers': { label: 'Job seekers', Icon: Users },
  employers: { label: 'Employers', Icon: Building2 },
  general: { label: 'General', Icon: CircleHelp },
};

const getItemKey = (item: FAQItem): string =>
  item.id ?? `${item.category ?? 'general'}-${item.question}`;

const getCategoryMeta = (category?: FAQItem['category']): CategoryMeta =>
  category ? categoryMeta[category] : categoryMeta.general;

const FAQModal: React.FC<FAQModalProps> = ({ item, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const meta = getCategoryMeta(item.category);
  const CategoryIcon = meta.Icon;

  useEffect(() => {
    modalRef.current?.focus();
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="faq-modal-backdrop fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="faq-modal-title"
      onKeyDown={handleKeyDown}
    >
      <div
        ref={modalRef}
        className="faq-modal-enter w-full max-w-xl overflow-hidden rounded-lg border border-white/70 bg-white shadow-[0_24px_80px_rgba(6,24,43,0.22)] outline-none"
        tabIndex={0}
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#dbe8f5] bg-[#f8fbff] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <div
              className={cn(
                'mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1',
                meta.chip
              )}
            >
              <CategoryIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {meta.label}
            </div>
            <h2 id="faq-modal-title" className="text-xl font-bold leading-tight text-[#102a47]">
              {item.question}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#48627c] transition hover:bg-white hover:text-[#102a47] focus:outline-none focus:ring-2 focus:ring-[#1a8fd8]"
            aria-label="Close answer"
            title="Close"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <p className="text-base leading-7 text-[#30475f]">{item.answer}</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 inline-flex items-center justify-center rounded-md bg-[#102a47] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#183b62] focus:outline-none focus:ring-2 focus:ring-[#f2c94c] focus:ring-offset-2"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

const FAQItemCard = memo<FAQItemCardProps>(
  ({ item, position, onClick, onPreview, onFocusCard, isFocused, index, isMobile }) => {
    const [isHovered, setIsHovered] = useState<boolean>(false);
    const meta = getCategoryMeta(item.category);
    const CategoryIcon = meta.Icon;
    const isActive = isFocused || isHovered;
    const cardScale = position.scale * (isActive ? 1.1 : 1);

    const orbitStyle = {
      left: '50%',
      top: '50%',
      opacity: position.opacity,
      zIndex: isActive ? 80 : position.zIndex,
      transform: `translate3d(${position.x}px, ${position.y}px, 0) translate(-50%, -50%) rotate(${position.tilt}deg)`,
      '--card-index': index,
    } as CSSProperties;

    const cardStyle = {
      '--card-scale': cardScale,
    } as CSSProperties;

    const handlePointerEnter = (): void => {
      setIsHovered(true);
      onPreview();
    };

    const handleFocus = (): void => {
      setIsHovered(true);
      onPreview();
      onFocusCard();
    };

    return (
      <div className="faq-orbit-card absolute" style={orbitStyle} data-index={index}>
        <div className="faq-card-float">
          <button
            type="button"
            className={cn(
              'faq-card-face group relative flex flex-col overflow-hidden rounded-lg border bg-white/95 text-left shadow-[0_14px_35px_rgba(16,42,71,0.12)] outline-none backdrop-blur transition-[border-color,box-shadow,filter] duration-200 focus-visible:ring-2 focus-visible:ring-[#f2c94c] focus-visible:ring-offset-2',
              isMobile ? 'h-20 w-[7.2rem] p-2' : 'h-[7.8rem] w-[11.15rem] p-3.5',
              meta.border,
              isActive && 'shadow-[0_22px_52px_rgba(16,42,71,0.2)]'
            )}
            style={cardStyle}
            onClick={onClick}
            onMouseEnter={handlePointerEnter}
            onMouseLeave={() => setIsHovered(false)}
            onFocus={handleFocus}
            onBlur={() => setIsHovered(false)}
            aria-label={`Open FAQ answer: ${item.question}`}
          >
            <span className={cn('absolute inset-x-0 top-0 h-1', meta.rail)} aria-hidden="true" />
            <span className="flex items-center justify-between gap-3">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full py-1 text-[0.68rem] font-bold uppercase tracking-[0.08em]',
                  isMobile ? 'px-1.5' : 'px-2',
                  meta.chip
                )}
              >
                <CategoryIcon className="h-3 w-3" aria-hidden="true" />
                {isMobile ? meta.label.split(' ')[0] : meta.label}
              </span>
              <ArrowUpRight
                className={cn(
                  'h-4 w-4 text-[#8ca0b4] transition group-hover:text-[#102a47]',
                  isActive && 'text-[#102a47]'
                )}
                aria-hidden="true"
              />
            </span>

            <span
              className={cn(
                'text-center font-bold leading-snug text-[#18304b]',
                isMobile ? 'mt-1.5 line-clamp-2 text-[0.63rem]' : 'mt-3 line-clamp-3 text-[0.94rem]'
              )}
            >
              {item.question}
            </span>
          </button>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) =>
    prevProps.item.question === nextProps.item.question &&
    prevProps.item.category === nextProps.item.category &&
    prevProps.position.x === nextProps.position.x &&
    prevProps.position.y === nextProps.position.y &&
    prevProps.position.tilt === nextProps.position.tilt &&
    prevProps.position.scale === nextProps.position.scale &&
    prevProps.position.opacity === nextProps.position.opacity &&
    prevProps.isFocused === nextProps.isFocused
);

const FAQWheelPreview: React.FC = () => {
  const {
    selectedQuestion,
    isModalOpen,
    isAutoRotating,
    focusedIndex,
    isAnimating,
    faqItems,
    categoryCounts,
    activeCategory,
    isLoading,
    error,
    setFocusedIndex,
    handleRotate,
    handleQuestionClick,
    closeModal,
    toggleAutoRotation,
    handleCategoryChange,
    getItemPosition,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    isMobile,
  } = useFAQWheel();

  const [previewItem, setPreviewItem] = useState<FAQItem | null>(null);

  useEffect(() => {
    setPreviewItem(faqItems[0] ?? null);
  }, [activeCategory, faqItems]);

  const visiblePreview = useMemo(() => {
    if (!faqItems.length) return null;
    if (!previewItem) return faqItems[0];

    return faqItems.find(item => getItemKey(item) === getItemKey(previewItem)) ?? faqItems[0];
  }, [faqItems, previewItem]);

  const openPreview = (): void => {
    if (!visiblePreview) return;
    const previewIndex = faqItems.findIndex(
      item => getItemKey(item) === getItemKey(visiblePreview)
    );
    handleQuestionClick(previewIndex >= 0 ? previewIndex : 0);
  };

  const previewMeta = getCategoryMeta(visiblePreview?.category);
  const PreviewIcon = previewMeta.Icon;

  return (
    <section
      className="relative isolate w-full overflow-hidden bg-[#f6faff] px-4 py-10 sm:px-6 lg:px-10"
      aria-label="Workwise SA frequently asked questions"
    >
      <div
        className="absolute inset-0 -z-20 bg-[linear-gradient(135deg,#edf7ff_0%,#ffffff_46%,#fff7dd_100%)]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 -z-10 opacity-50 [background-image:linear-gradient(#d9e8f7_1px,transparent_1px),linear-gradient(90deg,#d9e8f7_1px,transparent_1px)] [background-size:38px_38px]"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d3e4f5] bg-white/80 px-3 py-1.5 text-sm font-semibold text-[#33516e] shadow-sm">
              <Sparkles className="h-4 w-4 text-[#dfa900]" aria-hidden="true" />
              Support center
            </div>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight text-[#102a47] sm:text-5xl">
              Workwise SA FAQ
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#4b647d] sm:text-lg">
              Fast, practical answers for job seekers and employers moving through the Workwise
              hiring journey.
            </p>
          </div>

          <div className="rounded-lg border border-[#d8e6f4] bg-white/[0.82] p-4 shadow-[0_12px_32px_rgba(16,42,71,0.08)] backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[#102a47] text-white">
                <BadgeCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[#102a47]">Answers at a glance</p>
                <p className="text-sm text-[#60758a]">{categoryCounts.all} common questions</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {(['job-seekers', 'employers', 'general'] as FAQCategory[]).map(category => {
                const meta = categoryMeta[category];

                return (
                  <div key={category} className="rounded-md bg-[#f5f9fd] px-2 py-2">
                    <p className="text-lg font-extrabold text-[#102a47]">
                      {categoryCounts[category]}
                    </p>
                    <p className="mt-0.5 truncate text-[0.68rem] font-semibold uppercase tracking-wide text-[#6d8296]">
                      {meta.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="FAQ categories">
          {(Object.keys(filterLabels) as FAQCategoryFilter[]).map(filter => {
            const { label, Icon } = filterLabels[filter];
            const isActive = activeCategory === filter;

            return (
              <button
                key={filter}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleCategoryChange(filter)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#1a8fd8] focus:ring-offset-2',
                  isActive
                    ? 'border-[#102a47] bg-[#102a47] text-white'
                    : 'border-[#d7e5f3] bg-white/90 text-[#36526d] hover:border-[#a9c8e4] hover:bg-white'
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs',
                    isActive ? 'bg-white/20 text-white' : 'bg-[#eef5fb] text-[#55708b]'
                  )}
                >
                  {categoryCounts[filter]}
                </span>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mt-10 flex min-h-64 flex-col items-center justify-center rounded-lg border border-red-100 bg-white/90 px-4 text-center shadow-sm">
            <HelpCircle className="mb-4 h-12 w-12 text-red-500" aria-hidden="true" />
            <p className="text-lg font-bold text-red-700">Sorry, we couldn't load the FAQ data</p>
            <p className="mt-2 text-sm text-[#60758a]">Please try refreshing the page.</p>
          </div>
        )}

        {isLoading && !error && (
          <div className="mt-10 flex min-h-64 flex-col items-center justify-center rounded-lg border border-[#d8e6f4] bg-white/80">
            <Loader className="mb-4 h-12 w-12 animate-spin text-[#1a8fd8]" aria-hidden="true" />
            <p className="text-lg font-semibold text-[#102a47]">Loading answers...</p>
          </div>
        )}

        {!isLoading && !error && faqItems.length > 0 && (
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center">
            <div
              className={cn(
                'faq-orbit-shell relative mx-auto flex w-full items-center justify-center overflow-visible',
                isMobile ? 'h-[41rem] max-w-sm' : 'h-[38rem] max-w-4xl'
              )}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              data-animating={isAnimating}
              data-auto={isAutoRotating}
              aria-roledescription="Interactive FAQ wheel"
            >
              <div className="absolute left-1/2 top-1/2 h-[76%] w-[84%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#bcd4ea]" />
              <div className="absolute left-1/2 top-1/2 h-[54%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#d8e6f4]" />
              <div className="absolute left-1/2 top-1/2 h-px w-[76%] -translate-x-1/2 bg-[#d9e8f7]" />
              <div className="absolute left-1/2 top-1/2 h-[68%] w-px -translate-y-1/2 bg-[#d9e8f7]" />

              <div className="faq-center absolute left-1/2 top-1/2 z-[90] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
                <div
                  className={cn(
                    'flex items-center justify-center rounded-full bg-[#102a47] text-white shadow-[0_18px_45px_rgba(16,42,71,0.26)] ring-8 ring-white/70',
                    isMobile ? 'h-20 w-20' : 'h-28 w-28'
                  )}
                >
                  <div className="text-center">
                    <CircleHelp
                      className={cn('mx-auto mb-1', isMobile ? 'h-5 w-5' : 'h-6 w-6')}
                      aria-hidden="true"
                    />
                    <span className={cn('font-extrabold', isMobile ? 'text-lg' : 'text-xl')}>
                      FAQ
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 rounded-full border border-white/80 bg-white/90 p-1 shadow-[0_12px_32px_rgba(16,42,71,0.12)] backdrop-blur">
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#102a47] transition hover:bg-[#eef6fd] focus:outline-none focus:ring-2 focus:ring-[#1a8fd8]"
                    onClick={() => handleRotate('left')}
                    aria-label="Rotate answers left"
                    title="Rotate left"
                  >
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={cn(
                      'inline-flex h-9 w-9 items-center justify-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-[#1a8fd8]',
                      isAutoRotating
                        ? 'bg-[#f2c94c] text-[#102a47]'
                        : 'bg-[#102a47] text-white hover:bg-[#183b62]'
                    )}
                    onClick={toggleAutoRotation}
                    aria-label={
                      isAutoRotating ? 'Pause automatic rotation' : 'Start automatic rotation'
                    }
                    title={isAutoRotating ? 'Pause rotation' : 'Auto rotate'}
                  >
                    <RotateCw
                      className={cn('h-4 w-4', isAutoRotating && 'animate-spin')}
                      aria-hidden="true"
                    />
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#102a47] transition hover:bg-[#eef6fd] focus:outline-none focus:ring-2 focus:ring-[#1a8fd8]"
                    onClick={() => handleRotate('right')}
                    aria-label="Rotate answers right"
                    title="Rotate right"
                  >
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {faqItems.map((item, index) => (
                <FAQItemCard
                  key={getItemKey(item)}
                  item={item}
                  position={getItemPosition(index, faqItems.length)}
                  onClick={() => handleQuestionClick(index)}
                  onPreview={() => setPreviewItem(item)}
                  onFocusCard={() => setFocusedIndex(index)}
                  isFocused={focusedIndex === index}
                  index={index}
                  isMobile={isMobile}
                />
              ))}

              <div className="sr-only">
                Use the left and right arrow keys to rotate FAQ answers. Press Enter on any card to
                open its answer.
              </div>
            </div>

            {visiblePreview && (
              <aside className="rounded-lg border border-[#d8e6f4] bg-white/90 p-5 shadow-[0_18px_44px_rgba(16,42,71,0.11)] backdrop-blur">
                <div
                  className={cn(
                    'mb-4 inline-flex h-11 w-11 items-center justify-center rounded-md',
                    previewMeta.iconWrap
                  )}
                >
                  <PreviewIcon className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#758ba0]">
                  {previewMeta.eyebrow}
                </p>
                <h2 className="mt-3 text-2xl font-extrabold leading-tight text-[#102a47]">
                  {visiblePreview.question}
                </h2>
                <p className="mt-4 line-clamp-5 text-sm leading-6 text-[#4b647d]">
                  {visiblePreview.answer}
                </p>
                <button
                  type="button"
                  onClick={openPreview}
                  className="mt-5 inline-flex items-center gap-2 rounded-md bg-[#102a47] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#183b62] focus:outline-none focus:ring-2 focus:ring-[#f2c94c] focus:ring-offset-2"
                >
                  Read answer
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </aside>
            )}
          </div>
        )}
      </div>

      {isModalOpen && selectedQuestion && <FAQModal item={selectedQuestion} onClose={closeModal} />}

      <style>{`
        @keyframes faqBackdropReveal {
          0% {
            opacity: 0;
            background: rgba(6, 24, 43, 0);
            backdrop-filter: blur(0);
          }
          64% {
            opacity: 1;
            background: rgba(6, 24, 43, 0.18);
            backdrop-filter: blur(0);
          }
          100% {
            opacity: 1;
            background: rgba(6, 24, 43, 0.62);
            backdrop-filter: blur(10px);
          }
        }

        @keyframes faqModalEnter {
          0% {
            opacity: 0;
            transform: perspective(1200px) translateY(34px) translateZ(-180px) rotateX(22deg)
              scale(0.72);
            filter: blur(5px);
          }
          44% {
            opacity: 0.72;
            transform: perspective(1200px) translateY(18px) translateZ(-88px) rotateX(12deg)
              scale(0.86);
            filter: blur(2px);
          }
          78% {
            opacity: 1;
            transform: perspective(1200px) translateY(-4px) translateZ(24px) rotateX(-3deg)
              scale(1.025);
            filter: blur(0);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes faqCardFloat {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(0, -7px, 0);
          }
        }

        @keyframes faqCardFaceReveal {
          0% {
            opacity: 0;
            transform: perspective(700px) rotateX(14deg) scale(calc(var(--card-scale, 1) * 0.84));
            filter: blur(5px);
          }
          58% {
            opacity: 0.76;
            transform: perspective(700px) rotateX(6deg) scale(calc(var(--card-scale, 1) * 0.94));
            filter: blur(2px);
          }
          100% {
            opacity: 1;
            transform: perspective(700px) rotateX(0deg) scale(var(--card-scale, 1));
            filter: blur(0);
          }
        }

        .faq-modal-backdrop {
          animation: faqBackdropReveal 760ms cubic-bezier(0.17, 0.84, 0.23, 1) both;
        }

        .faq-modal-enter {
          animation: faqModalEnter 760ms cubic-bezier(0.17, 0.84, 0.23, 1) both;
          transform-origin: 50% 22%;
        }

        .faq-orbit-shell {
          touch-action: pan-y;
          transform: translateZ(0);
        }

        .faq-orbit-card {
          will-change: transform, opacity;
          transform-style: preserve-3d;
          backface-visibility: hidden;
        }

        .faq-card-float {
          will-change: transform;
        }

        .faq-orbit-shell[data-auto='false'] .faq-card-float {
          animation: faqCardFloat 5.2s ease-in-out infinite;
          animation-delay: calc(var(--card-index, 0) * -360ms);
        }

        .faq-card-face {
          will-change: transform;
          transform-origin: center;
          transform: perspective(700px) rotateX(0deg) scale(var(--card-scale, 1));
          animation: faqCardFaceReveal 740ms cubic-bezier(0.18, 0.82, 0.18, 1) both;
          animation-delay: calc(var(--card-index, 0) * 42ms);
          transition:
            transform 170ms cubic-bezier(0.2, 0.8, 0.2, 1),
            border-color 170ms ease,
            box-shadow 170ms ease,
            filter 170ms ease;
        }

        .faq-card-face:hover,
        .faq-card-face:focus-visible {
          filter: saturate(1.04);
        }

        .faq-center {
          transition: filter 180ms ease;
        }

        @media (prefers-reduced-motion: reduce) {
          .faq-modal-enter,
          .faq-modal-backdrop,
          .faq-orbit-card,
          .faq-card-float,
          .faq-card-face,
          .faq-center,
          .faq-center * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </section>
  );
};

FAQItemCard.displayName = 'FAQItemCard';

export default FAQWheelPreview;
