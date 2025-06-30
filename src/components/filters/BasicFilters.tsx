
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterState } from "@/types/FilterTypes";

interface BasicFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const BasicFilters = ({ filters, onFiltersChange }: BasicFiltersProps) => {
  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Input
        placeholder="Search orders, customers, emails..."
        value={filters.search}
        onChange={(e) => updateFilter('search', e.target.value)}
      />
      <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
        <SelectTrigger>
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="requested">Requested</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="in_transit">In Transit</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filters.reason} onValueChange={(value) => updateFilter('reason', value)}>
        <SelectTrigger>
          <SelectValue placeholder="All Reasons" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Reasons</SelectItem>
          <SelectItem value="defective">Defective Item</SelectItem>
          <SelectItem value="wrong_size">Wrong Size</SelectItem>
          <SelectItem value="not_as_described">Not as Described</SelectItem>
          <SelectItem value="changed_mind">Changed Mind</SelectItem>
          <SelectItem value="damaged">Damaged in Transit</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default BasicFilters;
