
export interface FilterState {
  search: string;
  status: string;
  reason: string;
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  amountRange: {
    min: string;
    max: string;
  };
  aiConfidence: string;
}

export interface FilterProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}
