'use client';

export default function Header({ title, subtitle, rightElement }) {
  return (
    <header className="p-6 border-b border-white/5 bg-dark-800/50 sticky top-0 z-20 backdrop-blur-lg">
      <div className="max-w-4xl mx-auto flex justify-between items-center w-full">
        <div>
          <h1 className="text-3xl font-[family-name:var(--font-pt-sans-narrow)] font-black uppercase tracking-[0.1em] text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[10px] text-accent font-black uppercase tracking-[0.4em] mt-1 opacity-50 font-[family-name:var(--font-pt-sans-narrow)]">
              {subtitle}
            </p>
          )}
        </div>
        {rightElement && (
          <div>{rightElement}</div>
        )}
      </div>
    </header>
  );
}
