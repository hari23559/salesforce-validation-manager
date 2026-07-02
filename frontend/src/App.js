import React, { useState } from "react";
import axios from "axios";

function App() {
  const [rules, setRules] = useState([]);

  const loginToSalesforce = () => {
    window.location.href =
      "https://salesforce-validation-manager-backend-9pn9.onrender.com/auth/login";
  };

  const getValidationRules = async () => {
    const response = await axios.get(
      "https://salesforce-validation-manager-backend-9pn9.onrender.com/validation-rules"
    );
    setRules(response.data);
  };

  const toggleRule = async (rule) => {
    try {
      await axios.post(
        "https://salesforce-validation-manager-backend-9pn9.onrender.com/toggle-rule",
        {
          ruleName: rule.ValidationName,
          active: !rule.Active
        }
      );

      await getValidationRules();

      alert("Validation rule updated successfully.");
    } catch (error) {
      console.error(error);
      alert("Failed to update validation rule.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Salesforce Validation Rule Manager</h1>

      <button onClick={loginToSalesforce}>
        Login with Salesforce
      </button>

      <br /><br />

      <button onClick={getValidationRules}>
        Get Validation Rules
      </button>

      <br /><br />

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Validation Rule</th>
            <th>Active</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {rules.map((rule) => (
            <tr key={rule.Id}>
              <td>{rule.ValidationName}</td>
              <td>{rule.Active ? "Yes" : "No"}</td>
              <td>
                <button onClick={() => toggleRule(rule)}>
                  {rule.Active ? "Disable" : "Enable"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;