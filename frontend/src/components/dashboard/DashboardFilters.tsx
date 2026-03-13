import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

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
    <div className="flex flex-col sm:flex-row gap-4 rounded-xl border border-border bg-card p-4">
      <InputGroup>
        <InputGroupInput
          placeholder="Search devices by name, IP, MAC, or tags..."
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
        />
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
      </InputGroup>

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
