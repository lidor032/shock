export default function NewsFeed({ headlines }) {
  if (!headlines?.length) return null

  // Duplicate array to create seamless loop
  const items = [...headlines, ...headlines]

  return (
    <div className="absolute top-[52px] left-0 right-0 z-20 flex items-center mil-panel border-t border-b border-green-900 overflow-hidden">
      {/* Source label */}
      <div className="flex-shrink-0 bg-red-900 border-r border-red-700 px-3 py-1 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
        <span className="text-red-300 text-xs font-bold tracking-widest">LIVE NEWS</span>
      </div>

      {/* Scrolling ticker */}
      <div className="flex-1 overflow-hidden h-7 flex items-center">
        <div className="ticker-track flex gap-0">
          {items.map((h, i) => (
            <span key={`${i < headlines.length ? 'a' : 'b'}-${i}`} className="inline-flex items-center text-xs text-green-300 mr-10">
              <span className="text-yellow-500 mr-2 font-bold">[{h.source}]</span>
              <a
                href={h.url !== '#' ? h.url : undefined}
                target={h.url !== '#' ? '_blank' : undefined}
                rel="noreferrer"
                className={h.url !== '#' ? 'hover:text-green-100 cursor-pointer' : ''}
              >
                {h.title}
              </a>
              <span className="text-green-700 ml-3">{h.time}</span>
              <span className="text-green-800 mx-6">◆</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
