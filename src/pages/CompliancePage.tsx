import Layout from "@/components/Layout";
import ComplianceMonitoringDashboard from "@/components/ComplianceMonitoringDashboard";

const CompliancePage = () => {
  return (
    <Layout>
      <div className="container mx-auto px-6 py-6">
        <ComplianceMonitoringDashboard />
      </div>
    </Layout>
  );
};

export default CompliancePage;