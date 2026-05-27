import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/50 mt-32">
      <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="size-8 rounded-lg bg-gradient-primary grid place-items-center">
              <Sparkles className="size-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg">
              Placement<span className="text-gradient">IQ</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            AI-powered placement readiness platform helping students land their dream jobs.
          </p>
        </div>
        {[
          { title: "Product", items: ["Features", "Dashboard", "Pricing", "Roadmap"] },
          { title: "Resources", items: ["Blog", "Guides", "Mock Interviews", "Quizzes"] },
          { title: "Company", items: ["About", "Careers", "Contact", "Privacy"] },
        ].map((c) => (
          <div key={c.title}>
            <h4 className="text-sm font-semibold mb-3">{c.title}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {c.items.map((i) => (
                <li key={i}><a className="hover:text-foreground transition">{i}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border/50 py-6 text-center text-xs text-muted-foreground">
        © 2026 PlacementIQ. Crafted for the next generation of talent.
      </div>
    </footer>
  );
}
