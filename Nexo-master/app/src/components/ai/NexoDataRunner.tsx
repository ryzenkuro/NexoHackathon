import * as Progress from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';
import nexoLogo from '@/images/logo.png';

interface NexoDataRunnerProps {
  label: string;
  size?: 'compact' | 'default';
  className?: string;
}

export default function NexoDataRunner({
  label,
  size = 'default',
  className,
}: NexoDataRunnerProps) {
  return (
    <Progress.Root
      value={null}
      className={cn('nexo-data-track', size === 'compact' && 'nexo-data-track-compact', className)}
      aria-label={label}
    >
      <div className="nexo-data-runner" aria-hidden="true">
        <span className="nexo-data-trail" />
        <span className="nexo-data-runner-logo">
          <img src={nexoLogo} alt="" />
        </span>
        <span className="nexo-data-runner-spark nexo-data-runner-spark-one" />
        <span className="nexo-data-runner-spark nexo-data-runner-spark-two" />
      </div>
    </Progress.Root>
  );
}
