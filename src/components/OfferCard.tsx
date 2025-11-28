import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface OfferCardProps {
  title: string;
  description?: string;
  logoUrl?: string;
  reward: number;
  category?: string;
  status?: string;
  onStartTask?: () => void;
}

const OfferCard = ({
  title,
  description,
  logoUrl,
  reward,
  category,
  status = "active",
  onStartTask,
}: OfferCardProps) => {
  return (
    <Card className="p-4 hover:shadow-lg transition-all duration-300 border-border">
      <div className="flex gap-4">
        <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center flex-shrink-0">
          {logoUrl ? (
            <img src={logoUrl} alt={title} className="w-12 h-12 object-contain" />
          ) : (
            <span className="text-2xl font-heading font-bold text-primary">
              {title.charAt(0)}
            </span>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-heading font-semibold text-base line-clamp-1">{title}</h3>
            <Badge className="bg-success text-success-foreground whitespace-nowrap">
              ₹{reward}
            </Badge>
          </div>
          
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {description}
            </p>
          )}
          
          <div className="flex items-center justify-between gap-2">
            {category && (
              <Badge variant="secondary" className="text-xs">
                {category}
              </Badge>
            )}
            
            {onStartTask && (
              <Button
                size="sm"
                onClick={onStartTask}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6"
              >
                Start Task
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default OfferCard;
