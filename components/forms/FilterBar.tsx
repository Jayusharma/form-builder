/**
 * FilterBar Component
 * 
 * A reusable search and sort interface component that provides:
 * - Text-based search functionality
 * - Sortable list options
 * - Responsive layout
 * - Customizable placeholder text
 * 
 * Used across various form management interfaces for consistent filtering behavior
 * 
 * @component
 */

"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowUpDown } from "lucide-react";

/**
 * SortOption Type
 * Defines the available sorting options for forms
 * 
 * @typedef {("newest" | "oldest" | "mostSubmissions" | "leastSubmissions" | "pending" | "accepted")} SortOption
 */
export type SortOption = "newest" | "oldest" | "mostSubmissions" | "leastSubmissions" | "pending" | "accepted";

/**
 * FilterBarProps Interface
 * Defines the props for the FilterBar component
 * 
 * @interface
 * @property {string} searchQuery - Current search query value
 * @property {Function} onSearchChange - Callback for search query updates
 * @property {SortOption} sortBy - Current sort option
 * @property {Function} onSortChange - Callback for sort option updates
 * @property {Array} sortOptions - Available sort options with labels
 * @property {string} [placeholder="Search..."] - Placeholder text for search input
 */
interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  sortOptions: {
    value: SortOption;
    label: string;
  }[];
  placeholder?: string;
}

/**
 * FilterBar Component
 * Renders a search and sort interface
 * 
 * @param {FilterBarProps} props - Component props
 * @returns {JSX.Element} Rendered search and sort interface
 */
export function FilterBar({ 
  searchQuery, 
  onSearchChange, 
  sortBy, 
  onSortChange, 
  sortOptions,
  placeholder = "Search..." 
}: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Sort Select */}
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by">
            <div className="flex items-center">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              {sortOptions.find(option => option.value === sortBy)?.label}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 