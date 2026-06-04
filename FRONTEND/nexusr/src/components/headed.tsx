
interface HeadedProps {
  title: string;
  description: string;
}

export default function Headed({ title, description }: HeadedProps) {
    return (
        <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
          {title}
        </h1>
        <p className="text-slate-500 font-medium mt-1">
          {description} 
        </p>
      </div>
    )
}