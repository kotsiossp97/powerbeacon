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

interface AgentsFiltersProps {
  searchQuery: string;
  statusFilter: string;
  onSearchQueryChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
}

export const AgentsFilters = ({
  searchQuery,
  statusFilter,
  onSearchQueryChange,
  onStatusFilterChange,
}: AgentsFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 rounded-xl border border-border bg-card p-4">
      <InputGroup>
        <InputGroupInput
          placeholder="Search agents by hostname or IP..."
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
        />
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
      </InputGroup>

      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-full sm:w-37.5">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="online">Online</SelectItem>
          <SelectItem value="offline">Offline</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
