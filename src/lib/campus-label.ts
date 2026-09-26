type CampusLabelSource = {
  name: string;
  city?: string | null;
};

/** Keep the institute's legal/brand name in the database, but show a concise branch label in filters. */
export function getCampusDisplayName(campus: CampusLabelSource): string {
  const name = campus.name.trim();
  const withoutBrand = name
    .replace(/^futurex\s+learning\s*/i, "")
    .replace(/^futurex\s*/i, "")
    .replace(/\s+campus$/i, "")
    .trim();

  if (withoutBrand) return withoutBrand;

  const city = campus.city?.trim();
  if (city) return city.split(/\s+/)[0];

  return name;
}
