import type { SearchState } from "../types";

import { SearchIcon } from "../../SearchIcon";

type Props = {
  searchState: SearchState;
  handleSearch: (term: string) => void;
  navigateMatch: (direction: "next" | "prev") => void;
  hideSearch?: boolean;
};

function SearchboxHolder({ searchState, handleSearch, navigateMatch, hideSearch }: Props) {
  if (hideSearch)
    return null;

  return (
    <div className="search-container">
      <div className="search-input-container">
        <span role="img" aria-label="search"><SearchIcon /></span>
        <input
          type="text"
          placeholder="Search in JSON..."
          value={searchState.term}
          onChange={e => handleSearch(e.target.value)}
        />
      </div>
      {searchState.results.length > 0 && (
        <div className="search-results">
          <span>
            {searchState.currentIndex + 1}
            {" "}
            of
            {" "}
            {searchState.results.length}
            {" "}
            matches
          </span>
          <button onClick={() => navigateMatch("prev")}>Previous</button>
          <button onClick={() => navigateMatch("next")}>Next</button>
        </div>
      )}
    </div>
  );
}

export default SearchboxHolder;
