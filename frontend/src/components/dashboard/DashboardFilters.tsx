import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DashboardFiltersProps {
  searchQuery: string;
  osFilter: string;
  onSearchQueryChange: (value: string) => void;
  onOsFilterChange: (value: string) => void;
}

export const DashboardFilters = ({
  searchQuery,
  osFilter,
  onSearchQueryChange,
  onOsFilterChange,
}: DashboardFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search devices by name, IP, MAC, or tags..."
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          className="pl-10"
        />
      </div>

      <Select value={osFilter} onValueChange={onOsFilterChange}>
        <SelectTrigger className="w-full sm:w-37.5">
          <SelectValue placeholder="OS" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All OS</SelectItem>
          <SelectItem value="windows">Windows</SelectItem>
          <SelectItem value="linux">Linux</SelectItem>
          <SelectItem value="macos">macOS</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
