
import { Link } from "react-router-dom";


const Career = () => {
  const jobs = [
    { id: 1, title: "Electronics Engineer", department: "Engineering", location: "Tech City", type: "Full-time" },
    { id: 2, title: "Sales Representative", department: "Sales", location: "Remote", type: "Full-time" },
    { id: 3, title: "Technical Support", department: "Support", location: "Tech City", type: "Part-time" },
    { id: 4, title: "Product Manager", department: "Product", location: "Tech City", type: "Full-time" }
  ];

  return (
    <div className="career-container">
      <h1 className="career-title">Join Our Team</h1>
      <p className="career-subtitle">Build your career with Sonani Electronics</p>

      <div className="career-content">
        <div className="career-info">
          
          <h2>Why Work With Us?</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <h3>💰 Competitive Salary</h3>
              <p>Industry-leading compensation packages</p>
            </div>
            <div className="benefit-card">
              <h3>🏥 Health Benefits</h3>
              <p>Comprehensive medical and dental coverage</p>
            </div>
            <div className="benefit-card">
              <h3>📚 Learning & Growth</h3>
              <p>Professional development opportunities</p>
            </div>
            <div className="benefit-card">
              <h3>🏠 Work-Life Balance</h3>
              <p>Flexible working arrangements</p>
            </div>
          </div>
        </div>

        <div className="jobs-section">
          <h2>Open Positions</h2>
          <div className="jobs-list">
            {jobs.map(job => (
              <div key={job.id} className="job-card">
                <h3 className="job-title">{job.title}</h3>
                <div className="job-details">
                  <span className="job-department">{job.department}</span>
                  <span className="job-location">{job.location}</span>
                  <span className="job-type">{job.type}</span>
                </div>
                
                <Link to="/apply-job" className="apply-btn">
  Apply
</Link>

              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Career;