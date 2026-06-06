interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'span' | 'p';
}

export function GradientText({ children, className = '', as: Tag = 'span' }: GradientTextProps) {
  return (
    <Tag className={`gradient-text ${className}`}>
      {children}
      <style jsx>{`
        .gradient-text {
          background: linear-gradient(135deg, #2ECC71 0%, #27AE60 50%, #F39C12 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
    </Tag>
  );
}