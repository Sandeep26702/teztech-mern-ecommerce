import { useState } from "react";


const JobApply = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    position: "",
    resume: null,
    coverLetter: "",
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Job application submitted successfully!");
  };

  return (
    <div className="jobapply-container">
      <div className="jobapply-card">
        <h1 className="jobapply-title">Job Application</h1>
        <p className="jobapply-subtitle">Apply for your desired position</p>

        <form onSubmit={handleSubmit}>
          <div className="jobapply-form-group">
            <label>Full Name</label>
            <input type="text" name="fullName" required onChange={handleChange} />
          </div>

          <div className="jobapply-form-group">
            <label>Email Address</label>
            <input type="email" name="email" required onChange={handleChange} />
          </div>

          <div className="jobapply-form-group">
            <label>Phone Number</label>
            <input type="tel" name="phone" required onChange={handleChange} />
          </div>

          <div className="jobapply-form-group">
            <label>Applying Position</label>
            <input type="text" name="position" required onChange={handleChange} />
          </div>

          <div className="jobapply-form-group">
            <label>Upload Resume</label>
            <input type="file" name="resume" accept=".pdf,.doc,.docx" required onChange={handleChange} />
          </div>

          <div className="jobapply-form-group">
            <label>Cover Letter</label>
            <textarea name="coverLetter" rows="4" onChange={handleChange}></textarea>
          </div>

          <button type="submit" className="jobapply-button">Apply Now</button>
        </form>
      </div>
    </div>
  );
};

export default JobApply;
