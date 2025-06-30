
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { FilterState } from "@/types/FilterTypes";

interface DateRangeFilterProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const DateRangeFilter = ({ filters, onFiltersChange }: DateRangeFilterProps) => {
  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Date Range</label>
      <div className="flex space-x-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateRange.from ? format(filters.dateRange.from, "MMM dd") : "From"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.dateRange.from}
              onSelect={(date) => updateFilter('dateRange', { ...filters.dateRange, from: date })}
            />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateRange.to ? format(filters.dateRange.to, "MMM dd") : "To"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.dateRange.to}
              onSelect={(date) => updateFilter('dateRange', { ...filters.dateRange, to: date })}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default DateRangeFilter;
