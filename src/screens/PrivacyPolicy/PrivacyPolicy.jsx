import React from "react";
import "./style.css";
import { Helmet } from "react-helmet";

export const PrivacyPolicy = () => {
  return (
    <div style={{ padding: "20px" }}>
      <div className="privacy-policy" style={{ padding: "20px" }}>
        <div
        onClick={() => {window.location.href = "/"}}
        className="privacy-back-button"
        >
          Go home
        </div>
      </div>
      <h1>Privacy Policy</h1>
      <p>MEDINGEN recognizes the value of your privacy of your information. The Policy describes how we treat the information collected on the platform and other sources. It contains about the rights and how you can contact MEDINGEN about privacy practices. Upon using the Platform, the user agrees to the Policy.</p>

      <h2>1. Definitions</h2>
      <p>1.1 Data – Personal, non-personal and sensitive information collected when you use the platform.</p>
      <p>1.2 Cookies - They are small pieces of text sent to your device by our website or mobile application when you visit which records the actions and preferences of the users.</p>
      <p>1.3 Data Protection Laws – All laws that governs data usage</p>
      <p>1.4 User/You – A natural person who access the website and mobile application</p>

      <h2>2. Information collected:</h2>
      <p>2.1 Personal information – Name, sex, date of birth, demography, phone number, e-mail address, postal address and other similar information;</p>
      <p>2.2 Financial information – Payment instrument, transactions preference, transaction methods, financial behaviour and other similar information;</p>
      <p>2.3 Technical information – IP address, website and application usage, cookies and other similar information;</p>
      <p>2.4 Product and Service information – Login details, account details, product and service order, product and service requested in platform, or in any other marketing programs.</p>
      <p>2.5 Health information – Health conditions, medications, diagnostic details.</p>

      <h2>3. Information collected in different ways:</h2>
      <h3>3.1 Directly from you:</h3>
      <p>3.1.1 Details shared during registration in the platform</p>
      <p>3.1.2 During payment or any transactions carried on the platform</p>
      <p>3.1.3 Voluntarily provided in survey conducted on platform</p>
      <p>3.1.4 Opted to receive the promotional offers</p>
      <h3>3.2 Collected passively</h3>
      <p>3.2.1 We automatically collect certain information when the user uses the platform which helps us in making improvements in the platform;</p>
      <p>3.2.2 Our web servers or affiliates provide analytics and performance enhancement services collect IP address, OS details, device details, language settings. This information is used to measure the average visits in the platform, pages viewed;</p>
      <p>3.2.3 We may collect your data automatically via cookies and similar technologies;</p>

      <h2>4. Use of Data</h2>
      <p>The data collected except the information received from Google APIs may be used for the following purpose,</p>
      <p>4.1 To carry out our obligations arising from any contract entered into between you and us;</p>
      <p>4.2 To provide products and/or services and communicate with you about products and/or services offered by us;</p>
      <p>4.3 To provide you with offers (including for financial products and/or services), personalized services and recommendations and improve your experience on our website and mobile application;</p>
      <p>4.4 To operate, evaluate and improve our business, website and mobile application;</p>
      <p>4.5 To generate aggregated data to prepare insights to enable us to understand customer behaviour, patterns and trends with a view to learning more about your preferences or other characteristics;</p>
      <p>4.6 To provide privileges and benefits to you, marketing and promotional campaigns based on your profile;</p>
      <p>4.7 To communicate with you (including to respond to your requests, questions, feedback, claims or disputes) and to customize and improve our services;</p>
      <p>4.8 To enforce the terms of use of our website and mobile application;</p>
      <p>4.9 To protect against and prevent fraud, illegal activity, harm, financial loss and other legal or information security risks;</p>
      <p>4.10 To serve other purposes for which we provide specific notice at the time of collection, and as otherwise authorized or required by applicable law.</p>
      <p>4.11 We treat these inferences as personal information (or sensitive personal information, as the case may be), where required under applicable law. Some of the above grounds for processing will overlap and there may be several grounds which justify our use of your personal information.</p>
      <p>Where required under the law, we will use your personal information with your consent as necessary to provide you with a legal obligation; or when there is a legitimate interest that necessitates the use.</p>

      <h2>5. Sharing of data</h2>
      <p>MEDINGEN may share, disclose the information except the information received from the Google APIs, for the purposes that include the following,</p>
      <p>5.1 Partners</p>
      <p>We may make available to you the services, products or applications provided by partners for use on or through our website or mobile application. If you choose to use such services, customer information related to those transactions may be shared with such partner. The partners will be required to respect the security of the data and to treat it in accordance with this privacy policy.</p>
      <p>5.2 Service Providers</p>
      <p>MEDINGEN may share the data with service providers for storing and analysis of data, providing search results, customer service, analysis and payment process;</p>
      <p>5.3 MEDINGEN may release the data whenever necessary to protect the interests of individuals, for any investigations, protection from fraudulent or illegal activity in accordance to the law. This may include exchange of information with other companies and organization for fraud protection, risk management and dispute resolution.</p>
      <p>5.4 We may share data to with Third Parties,</p>
      <p>a. Upon authorization by you</p>
      <p>b. To comply with applicable law, to respond to legal process</p>
      <p>c. To operate and maintain security of our platform or to prevent any attack on our computer</p>
      <p>d. We require these third parties by contract to only process sensitive personal data in accordance with our instructions and as necessary to perform services on our behalf or in compliance with applicable law. We also require them to safeguard the security and confidentiality of the sensitive personal data they process on our behalf by implementing appropriate confidentiality, technical and organizational security measures.</p>

      <h2>6. Minors</h2>
      <p>The website and mobile application only entertain users above 18 years of age from using the platform.</p>

      <h2>7. Data Security</h2>
      <p>MEDINGEN takes utmost care in safeguarding the data and we store your data in secure servers in encrypted form. The data is safely stored in encrypted form even in transit. We will use technical and organizational measures to secure the data. If you suspect any misuse or loss or unauthorized access to your data, please inform us immediately.</p>

      <h2>8. Retention of Data</h2>
      <p>MEDINGEN retains data as long you use our products and services or access the platform, to comply any legal obligations. The retention of data is necessary and is permissible by law. The closure of account does not obligate the us to retain the data and we delete the data without any further obligation. However, we may retain the data related to you if we believe it may be necessary to prevent any abuse or if required by law.</p>

      <h2>9. Rights</h2>
      <p>We process the data with your consent, and you have the following rights in relation to the data,</p>
      <p>9.1 Right to access, review and modify the data</p>
      <p>9.2 Right to correction</p>
      <p>9.3 Right to withdraw consent</p>

      <h2>10. Storage of data</h2>
      <p>Data collected under this privacy policy is hosted in servers located in India.</p>

      <h2>11. App Permissions</h2>
      <p>11.1 Location – This is used for the purpose of delivery of products and services.</p>
      <p>11.2 Camera – To allow you to take photographs of prescriptions and for video consultations.</p>
      <p>11.3 Photos/Media/Files – To store and retrieve prescriptions.</p>
      <p>11.4 SMS – To send you payment-related and order-related SMS.</p>
      <p>11.5 Access WIFI state – To optimize your experience especially for video consultations.</p>
      <p>11.6 Record Audio – For video consultations.</p>
      <p>11.7 Bluetooth – To redirect to the Bluetooth headset.</p>

      <h2>12. Compliance with the Google User Data Policy</h2>
      <p>MEDINGEN’s use of information received from Google APIs will adhere to Google API Services User Data Policy including the Limited Use requirements and Limited Use Requirements shall apply to both raw data obtained from Restricted and Sensitive Scopes and data aggregated, anonymized or derived from them.</p>

      <h2>13. Severability</h2>
      <p>If any of the provision is deemed as invalid by law, it shall be severed to the extent that it is invalid, and the rest of the policy shall continue to operate.</p>

      <h2>14. Amendments to the policy</h2>
      <p>The policy may be updated from time to time. Kindly review the same periodically.</p>

      <h2>15. Contact Us</h2>
      <p>If you have any questions about this Policy, wish to exercise your rights, please contact us at <a href="mailto:support@medingen.in">support@medingen.in</a>.</p>

      <h2>16. Grievance Officer</h2>
      <p>Name: Ms. Ramyashree Girish</p>
      <p>Email: <a href="mailto:grievancemig@gmail.com">grievancemig@gmail.com</a></p>
    </div>
  );
};

export const GrievanceRedressalPolicy = () => {
  return (
    <div className="grievance" style={{ padding: "20px" }}>
      <div
        onClick={() => {window.location.href = "/"}}
        className="privacy-back-button"
      >
        Go home
      </div>

      <h1>Grievance Redressal Policy</h1>

      <h2>1. Policy Overview</h2>
      <p>
        The policy sets out MEDINGEN's grievance redressal process to resolve
        grievances raised by consumers using the platform.
      </p>

      <h2>2. Company Details</h2>
      <ul>
        <li>
          <strong>Legal Entity Name:</strong> MEDINGEN
        </li>
        <li>
          <strong>Corporate Office:</strong> No.16, Ground Floor, School Street,
          Mangadu, Chennai 600 122
        </li>
        <li>
          <strong>Registered Office:</strong> No.16, Ground Floor, School
          Street, Mangadu, Chennai 600 122
        </li>
        <li>
          <strong>Website Name:</strong>{" "}
          <a
            href="https://www.medingen.in"
            target="_blank"
            rel="noopener noreferrer"
          >
            www.medingen.in
          </a>
        </li>
        <li>
          <strong>Website Details:</strong> E-commerce healthcare technology
          platform
        </li>
      </ul>

      <h2>3. Contact Information</h2>
      <p>In case of any query or complaint, feel free to contact us:</p>
      <ul>
        <li>
          <strong>Email:</strong>{" "}
          <a href="mailto:support@medingen.in">support@medingen.in</a>
        </li>
        <li>
          <strong>Phone Number:</strong> 709 0123 709
        </li>
      </ul>

      <h2>4. Grievance Redressal Mechanism</h2>
      <p>
        If you are not satisfied with the resolution provided by our customer
        care, you may escalate the issue to the grievance officer.
      </p>

      <h3>Steps for Redressal:</h3>
      <ol>
        <li>The consumer may connect via telephonic conversation or e-mail.</li>
        <li>
          The grievance officer will acknowledge the receipt of the complaint
          within 48 hours.
        </li>
        <li>
          A unique ID will be provided to track the status of the complaint.
        </li>
        <li>
          The issue will be addressed within 1 month from the date of receipt of
          the complaint.
        </li>
      </ol>

      <h3>Grievance Officer:</h3>
      <ul>
        <li>
          <strong>Name:</strong> Ms. Ramyashree Girish
        </li>
        <li>
          <strong>Email:</strong>{" "}
          <a href="mailto:grievancemig@gmail.com">grievancemig@gmail.com</a>
        </li>
      </ul>

      <p>
        The complaint will be considered closed if the customer care or
        grievance officer has addressed the issue to the customer's satisfaction
        and the customer accepts the closure of the complaint.
      </p>
    </div>
  );
};

export const TermsAndConditions = () => {
  return (
    <div className="terms-conditions" style={{ padding: "20px" }}>
      <div
        onClick={() => {window.location.href = "/"}}
        className="privacy-back-button"
      >
        Go home
      </div>

      <h1>Terms and Conditions</h1>

      <h2>GENERAL</h2>
      <ol>
        <li>
          The domain{" "}
          <a
            href="https://www.medingen.in"
            target="_blank"
            rel="noopener noreferrer"
          >
            www.medingen.in
          </a>{" "}
          is a platform and mobile application (collectively referred to as
          “platform”), owned and operated by Medingen, a proprietorship firm,
          with its registered office at No. 16, Ground Floor, School Street,
          Mangadu, Chennai - 600122. Hereinafter referred to as MEDINGEN.
        </li>
        <li>
          For the purposes of these Terms and Conditions, “You” or “User” refers
          to any natural or legal person who accesses, uses, or registers on the
          platform.
        </li>
        <li>
          These Terms and Conditions are legally binding between you (the user)
          and MEDINGEN. By accessing the platform, you agree to be bound by
          them. If you do not agree, please refrain from accessing the platform.
        </li>
        <li>
          These Terms and Conditions may be updated regularly by MEDINGEN. Your
          continued use of the platform signifies your acceptance of any
          modifications. Please review the Terms and Conditions regularly.
        </li>
        <li>
          By using or accessing the platform, you are legally bound by the Terms
          and Conditions and other policies available on the platform.
        </li>
        <li>
          This platform facilitates the following services provided by third
          parties:
          <ol type="a">
            <li>Purchase and sale of medicines by Third-Party Pharmacies</li>
            <li>Diagnostic services by Third-Party Diagnostic Centres</li>
            <li>
              Online medical consultancy services by Third-Party Medical
              Practitioners
            </li>
            <li>Promotional activity by Third-Party Advertisers</li>
            <li>Services by Third-Party Service Providers</li>
            <li>Information Services</li>
          </ol>
          Hereinafter collectively referred to as the “Third Party.” The
          arrangement between You, MEDINGEN, and the Third Party shall be in
          accordance with these Terms and Conditions.
        </li>
        <li>
          You must register with the MEDINGEN platform to access the services
          provided by MEDINGEN.
        </li>
        <li>
          You must be at least 18 years of age to access the platform, and by
          accessing the platform, you confirm that you are 18 years or older and
          agree to these Terms and Conditions.
        </li>
        <li>
          MEDINGEN reserves the right to alter these Terms and Conditions at its
          discretion. Any modifications will be updated on the platform and
          notified to you.
        </li>
        <li>
          The Terms and Conditions are governed by the following laws:
          <ul>
            <li>Indian Contract Act, 1872</li>
            <li>
              Information Technology Act, 2000, and respective rules,
              regulations, guidelines
            </li>
            <li>
              Information Technology (Reasonable Security Practices and
              Procedures and Sensitive Personal Information) Rules, 2011
            </li>
            <li>
              Information Technology (Intermediaries Guidelines) Rules, 2011
            </li>
            <li>
              The Drugs and Cosmetics Act, 1940 read with Drugs and Cosmetics
              Rules, 1945
            </li>
            <li>
              The Drugs and Magic Remedies (Objectionable Advertisement) Act,
              1954
            </li>
            <li>
              Indian Medical Council Act, 1956 read with Indian Medical Council
              Rules, 1957
            </li>
            <li>Pharmacy Act, 1948</li>
            <li>
              Consumer Protection Act, 2019 read with Consumer Protection
              E-Commerce Rules, 2020
            </li>
            <li>Data Protection Act, 2023</li>
          </ul>
        </li>
        <li>
          The platform’s contents are only for authorized usage, including
          accessing the platform, placing orders, receiving orders, and
          communicating for these purposes. Using the platform outside of these
          agreed terms constitutes a violation of this contract.
        </li>
        <li>
          All content on the platform, including text, images, logos, designs,
          graphics, and software, is protected under respective laws.
          Unauthorized use amounts to infringement of Intellectual Property
          Rights and other applicable laws.
        </li>
      </ol>
    </div>
  );
};

export const ReturnRefundCancellationPolicy = () => {
  return (
<>
  
    <div className="return-policy" style={{ padding: "20px" }}>
      <div
        onClick={() => {window.location.href = "/"}}
        className="privacy-back-button"
      >
        Go home
      </div>

      <h1>Return, Refund, and Cancellation Policy</h1>

      <h2>RETURN POLICY</h2>

      <h3>1. Return of Products</h3>
      <p>
        (a) We take utmost care in delivering products as per your order. Only
        products eligible for return can be returned within 5 days from the date
        of delivery.
      </p>
      <p>
        (b) A product can only be returned if it meets one of the following
        conditions:
      </p>
      <ul>
        <li>Incorrect product</li>
        <li>Incomplete order</li>
        <li>Expired product</li>
        <li>Damaged products</li>
      </ul>
      <p>
        It is the user’s responsibility to thoroughly check the product. Please
        do not accept products if the seal of the package is tampered with in
        transit. Acceptance of a damaged product will make it ineligible under
        the return policy.
      </p>

      <h3>2. Products Not Eligible for Return</h3>
      <p>
        (a) The following categories and product types do not qualify for
        return:
      </p>
      <table border="1" cellPadding="10" cellSpacing="0">
        <thead>
          <tr>
            <th>Category</th>
            <th>Type of Products</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Baby Care</td>
            <td>
              Bottle Nipples, Breast Nipple Care, Breast Pumps, Diapers, Ear
              Syringes, Nappy, Wet Reminder, Wipes, Wipe Warmers
            </td>
          </tr>
          <tr>
            <td>Food and Nutrition</td>
            <td>Health Drinks, Health Supplements</td>
          </tr>
          <tr>
            <td>Healthcare Devices</td>
            <td>
              Glucometer Lancet/Strip, Healthcare Devices and Kits, Surgical,
              Health Monitors
            </td>
          </tr>
          <tr>
            <td>Sexual Wellness</td>
            <td>
              Condoms, Fertility Kit/Supplement, Lubricants, Pregnancy Kits
            </td>
          </tr>
          <tr>
            <td>Temperature Controlled and Specialty Medicines</td>
            <td>
              Vials, Injections, Vaccines, Penfills, or any product requiring
              cold storage, or those that fall under the category of specialty
              medicines
            </td>
          </tr>
        </tbody>
      </table>

      <h3>3. Return Process</h3>
      <p>(a) To return a product, please contact MEDINGEN:</p>
      <ul>
        <li>
          <strong>Email:</strong>{" "}
          <a href="mailto:support@medingen.in">support@medingen.in</a>
        </li>
        <li>
          <strong>Phone:</strong> 709 0123 709
        </li>
      </ul>
      <p>
        (b) The MEDINGEN team will verify if the claim meets the eligibility
        criteria mentioned above.
      </p>
      <p>(c) Upon satisfaction, the return process will be initiated.</p>
      <p>
        (d) The customer shall return the package through the nearest courier
        service using the TOPAY option.
      </p>

      <h2>REFUND POLICY</h2>
      <p>
        1. Refunds will be initiated only upon confirmation by the collection
        agent after the reverse pickup.
      </p>
      <p>
        2. The amount will be refunded either as MIG cashback or to the original
        source account.
      </p>

      <h2>CANCELLATION POLICY</h2>
      <p>
        The cancellation of an order by the user will only be accepted if the
        cancellation is made before the shipment of the products.
      </p>
    </div>
    </>
  );
};

export default ReturnRefundCancellationPolicy;
