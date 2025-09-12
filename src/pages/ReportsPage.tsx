import Layout from "@/components/Layout";
import ReportsDashboard from "@/components/ReportsDashboard";

const ReportsPage = () => {
  return (
    <Layout>
      <div className="container mx-auto px-6 py-6">
        <ReportsDashboard />
      </div>
    </Layout>
  );
};

export default ReportsPage;