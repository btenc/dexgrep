# DEXGREP

Kinda like grep for Pokémon. Create simple or complex queries that return all Pokémon that match the constraints.

Static site. No build, no dependencies.
Visit at: https://dexgrep.com/ or, clone and open `index.html` in a browser.

## Usage

1. Add filters using the `+` buttons in each section
2. Press **run** or hit Enter to query
3. Results show type matchup columns computed with ability awareness
4. Click any stat column header to sort

## Filters

- **Name**: include or exclude by name substring, AND/OR-able
- **Type**: filter by the Pokémon's own type(s), AND/OR-able
- **Moves**: filter by possible moves, with optional STAB check, AND/OR-able
- **Type Effectiveness**: filter by how a type hits the Pokémon (resists, immune, weak, etc.)
- **Ability**: filter by ability name, OR-able
- **Stats**: numeric comparisons on any stat, BST, or dex #, AND-able
- **Regulation**: limit results to a specific competitive format

## Examples

"What are all the electric type Pokémon that are dual type with either ghost or flying, can use Discharge or Thunderbolt, Volt Switch, and either Shadow Ball with STAB or Tailwind, are immune to ground, and have a special attack equal to or over 90 sorted by special attack descending?"

![Electric Example](assets/electric_example.png)

"What is the fastest alolan Pokémon?"

![Alolan Example](assets/alolan_example.png)

## Abilities not taken into account for type matchups

- **Filter / Solid Rock / Prism Armor**: reduce super-effective damage by 25%, still "weak" to those types (1.5x)
- **Multiscale / Shadow Shield / Tera Shell**: conditional (full HP, first hit), not static
- **Ice Scales / Punk Rock**: halve a damage category (special / sound), not type-specific
- **Protean / Libero / Forecast / Multitype / RKS System**: type changes dynamically
- **Fluffy** (contact halving part, fire weakness is used), **Soundproof**, **Bulletproof**: move-specific, not type-specific

## Data

Fetched from [PokéAPI](https://pokeapi.co) and cached to your browser's localStorage. Hit "refresh data" to re-fetch from the API (pls do not spam, we are caching for a reason as they offer their API for free!).

## Development

All files formatted with [Prettier](https://prettier.io) using the default config.

## TODO

- Add query link sharing in URL
- Add more regulations, add Smogon regulations, add generation filters.
- Notify user if entered move or ability does not exist
- Domain
