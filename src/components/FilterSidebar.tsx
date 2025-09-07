import { useState } from "react"
import { Filter, X, BookOpen, Calendar, Star, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

interface FilterOptions {
  categories: string[]
  yearRange: [number, number]
  minRating: number
  pageRange: [number, number]
}

interface FilterSidebarProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  activeFiltersCount: number
}

const categories = [
  { id: "fiction", label: "Fiction", icon: BookOpen },
  { id: "non-fiction", label: "Non-Fiction", icon: Users },
  { id: "science", label: "Science", icon: BookOpen },
  { id: "technology", label: "Technology", icon: BookOpen },
  { id: "business", label: "Business", icon: BookOpen },
  { id: "self-help", label: "Self Help", icon: BookOpen },
  { id: "biography", label: "Biography", icon: Users },
  { id: "history", label: "History", icon: Calendar },
]

export function FilterSidebar({ filters, onFiltersChange, activeFiltersCount }: FilterSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    const newCategories = checked
      ? [...filters.categories, categoryId]
      : filters.categories.filter(c => c !== categoryId)
    
    onFiltersChange({ ...filters, categories: newCategories })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      categories: [],
      yearRange: [1900, new Date().getFullYear()],
      minRating: 0,
      pageRange: [0, 1000]
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="h-5 w-5 p-0 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-80 overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </SheetTitle>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                <X className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-6 pt-6">
          {/* Categories */}
          <div>
            <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Categories
            </h3>
            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={category.id}
                    checked={filters.categories.includes(category.id)}
                    onCheckedChange={(checked) => 
                      handleCategoryChange(category.id, !!checked)
                    }
                  />
                  <label 
                    htmlFor={category.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {category.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Rating */}
          <div>
            <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
              <Star className="w-4 h-4" />
              Minimum Rating
            </h3>
            <div className="px-2">
              <Slider
                value={[filters.minRating]}
                onValueChange={([value]) => 
                  onFiltersChange({ ...filters, minRating: value })
                }
                max={5}
                min={0}
                step={0.5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0</span>
                <span className="font-medium">{filters.minRating}+ stars</span>
                <span>5</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Publication Year */}
          <div>
            <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Publication Year
            </h3>
            <div className="px-2">
              <Slider
                value={filters.yearRange}
                onValueChange={(range) => 
                  onFiltersChange({ ...filters, yearRange: range as [number, number] })
                }
                max={new Date().getFullYear()}
                min={1900}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{filters.yearRange[0]}</span>
                <span>{filters.yearRange[1]}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Page Count */}
          <div>
            <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Page Count
            </h3>
            <div className="px-2">
              <Slider
                value={filters.pageRange}
                onValueChange={(range) => 
                  onFiltersChange({ ...filters, pageRange: range as [number, number] })
                }
                max={1000}
                min={0}
                step={50}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{filters.pageRange[0]}</span>
                <span>{filters.pageRange[1]} pages</span>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}