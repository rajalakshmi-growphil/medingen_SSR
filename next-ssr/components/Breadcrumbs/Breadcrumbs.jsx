import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import './Breadcrumbs.css';

const routeNameMap = {
    'product': 'Product',
    'salt': 'Salts & Ingredients',
    'savedaddress': 'Address',
    'addressnew': 'Add New Address',
    'upload-prescription': 'Upload Prescription',
    'select-prescription': 'Select Prescription',
    'order-placed-success': 'Order Success',
    'order-confirmed': 'Order Confirmed',
    'login': 'Login',
    'login2': 'Login Step 2',
    'login3': 'Login Step 3',
    'create-profile': 'Create Profile',
    'enterpassword': 'Enter Password',
    'change-password': 'Change Password',
    'existing': 'Existing User',
    'searchbox': 'Search',
    'search-results': 'Search Results',
    'compare': 'Compare Products',
    'offers': 'Offers',
    'rewards': 'Rewards',
    'view-offer': 'Offer Details',
    'cart': 'Cart',
    'order-progress': 'Order Progress',
    'order-payment': 'Payment',
    'orders': 'My Orders',
    'notification': 'Notifications',
    'profile': 'Account',
    'createpassword': 'Create Password',
    'capture-prescription': 'Capture Prescription',
    'help-center': 'Help Center',
    'privacy-policy': 'Privacy Policy',
    'terms-and-conditions': 'Terms & Conditions',
    'grievance-redressal-policy': 'Grievance Redressal',
    'return-policy': 'Return Policy',
    'blogs': 'Blogs',
    'order-details': 'Order Details',
    'order': 'Order Track'
};

const routeHierarchy = {
    'savedaddress': ['profile'],
    'addressnew': ['profile', 'savedaddress'],
    'orders': ['profile'],
    'change-password': ['profile'],
    'notification': ['profile'],
    'rewards': ['profile'],
    'order-details': ['profile', 'orders'],
    'order': ['profile', 'orders']
};

const titleCase = (str) => {
    return str
        .toLowerCase()
        .split(/[- ]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const Breadcrumbs = ({ className = "" }) => {
    const location = useLocation();

    const pathnames = location.pathname.split('/').filter((x) => x);

    if (pathnames.length === 0) {
        return null;
    }

    // 1. Check for hierarchy based on any segment in the path, but prioritize the last named segment
    const namedSegments = pathnames.filter(s => isNaN(s) || routeNameMap[s.toLowerCase()]);
    const mainSegment = namedSegments[namedSegments.length - 1]?.toLowerCase();
    let breadcrumbTrail = [];

    const searchParams = new URLSearchParams(location.search);
    const categoryName = searchParams.get("name");

    if (location.state && location.state.parent) {
        const parentKey = location.state.parent;
        const decodedParent = decodeURIComponent(parentKey);
        breadcrumbTrail.push({
            path: `/${parentKey}`,
            name: routeNameMap[decodedParent.toLowerCase()] || titleCase(decodedParent)
        });
    } else if (mainSegment && routeHierarchy[mainSegment]) {
        routeHierarchy[mainSegment].forEach(parentKey => {
            const decodedParent = decodeURIComponent(parentKey);
            breadcrumbTrail.push({
                path: `/${parentKey}`,
                name: routeNameMap[decodedParent.toLowerCase()] || titleCase(decodedParent)
            });
        });
    }

    // 2. Build current trail from named segments only
    const currentTrail = namedSegments.map((value, index) => {
        const to = `/${pathnames.slice(0, pathnames.indexOf(value) + 1).join('/')}`;
        const decoded = decodeURIComponent(value);
        let displayName = routeNameMap[decoded.toLowerCase()] || routeNameMap[value.toLowerCase()];

        if (!displayName) {
            displayName = titleCase(decoded);
        }

        return {
            path: to,
            name: displayName
        };
    });

    if (location.pathname === '/category' && categoryName) {
        currentTrail.push({
            path: location.pathname + `?name=${encodeURIComponent(categoryName)}`,
            name: decodeURIComponent(categoryName)
        });

        const subCategoryName = searchParams.get("sub");
        if (subCategoryName) {
            const subs = subCategoryName.split(",");
            subs.forEach(sub => {
                currentTrail.push({
                    path: location.pathname + `?name=${encodeURIComponent(categoryName)}&sub=${encodeURIComponent(sub)}`,
                    name: decodeURIComponent(sub)
                });
            });
        }
    }

    const finalTrail = [...breadcrumbTrail, ...currentTrail];


    return (
        <nav className="breadcrumbs-container" aria-label="breadcrumb">
            <ul className="breadcrumbs-list">
                <li className="breadcrumb-item">
                    <Link to="/" className="breadcrumb-link">Home</Link>
                </li>
                {finalTrail.map((crumb, index) => {
                    const isLast = index === finalTrail.length - 1;

                    return (
                        <li key={crumb.path + index} className={`breadcrumb-item ${isLast ? 'active' : ''}`}>
                            {isLast || crumb.name === "Pharmacist Verification" ? (
                                <span>{crumb.name}</span>
                            ) : (
                                <Link to={crumb.path} className="breadcrumb-link">{crumb.name}</Link>
                            )}
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
};

export default Breadcrumbs;
