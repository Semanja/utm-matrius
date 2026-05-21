import Wizard from "@/components/Wizard";
import { getCompanies, getCompanyData, type CompanyData } from "@/db/queries";

export default async function Home() {
  const companies = await getCompanies();

  // Префетчим данные всех настроенных компаний
  const data: Record<string, CompanyData> = {};
  for (const c of companies) {
    if (c.configured) {
      data[c.slug] = await getCompanyData(c.slug);
    }
  }

  return <Wizard companies={companies} data={data} />;
}
