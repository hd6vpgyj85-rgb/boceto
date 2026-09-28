import "./CategoryHero.css";

export default function CategoryHero({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="category-hero container">
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  );
}
