"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import './Breadcrumbs.css';

const routeNameMap: Record<string, string> = {
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

const routeHierarchy: Record<string, string[]> = {
    'savedaddress': ['profile'],
    'addressnew': ['profile', 'savedaddress'],
    'orders': ['profile'],
    'change-password': ['profile'],
    'notification': ['profile'],
    'rewards': ['profile'],
    'order-details': ['profile', 'orders'],
    'order': ['profile', 'orders']
};

const titleCase = (str: string) => {
    return str
        .toLowerCase()
        .split(/[- ]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

interface BreadcrumbsProps {
  className?: string;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ className = "" }) => {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const pathnames = pathname.split('/').filter((x) => x);

    if (pathnames.length === 0) {
        return null;
    }

    const namedSegments = pathnames.filter(s => isNaN(Number(s)) || routeNameMap[s.toLowerCase()]);
    const mainSegment = namedSegments[namedSegments.length - 1]?.toLowerCase();
    let breadcrumbTrail: Array<{ path: string; name: string }> = [];

    const categoryName = searchParams.get("name");

    // Check for hierarchy
    if (mainSegment && routeHierarchy[mainSegment]) {
        routeHierarchy[mainSegment].forEach(parentKey => {
            const decodedParent = decodeURIComponent(parentKey);
            breadcrumbTrail.push({
                path: `/${parentKey}`,
                name: routeNameMap[decodedParent.toLowerCase()] || titleCase(decodedParent)
            });
        });
    }

    // Build current trail from named segments only
    const currentTrail = namedSegments.map((value, index) => {
        const to = `/${pathnames.slice(0, pathnames.indexOf(value) + 1).join('/')}`;
        const decodedValue = decodeURIComponent(value);
        let displayName = routeNameMap[decodedValue.toLowerCase()] || titleCase(decodedValue);

        if (decodedValue.toLowerCase() === 'categories' && categoryName) {
            displayName = titleCase(categoryName);
        }

        return {
            path: to,
            name: displayName
        };
    });

    // Combine breadcrumbs hierarchy and current trail
    breadcrumbTrail = [...breadcrumbTrail, ...currentTrail];

    return (
        <nav aria-label="breadcrumb" className={`breadcrumbs-nav ${className}`}>
            <ol className="breadcrumbs-list">
                <li className="breadcrumbs-item">
                    <Link href="/">Home</Link>
                </li>
                {breadcrumbTrail.map((crumb, index) => {
                    const isLast = index === breadcrumbTrail.length - 1;
                    const shouldDisableNavigate = isLast || crumb.path === '/salt';
                    return (
                        <li key={crumb.path} className={`breadcrumbs-item ${isLast ? 'active' : ''}`}>
                            <span className="breadcrumbs-separator">/</span>
                            {shouldDisableNavigate ? (
                                <span aria-current="page" style={crumb.path === '/salt' ? { cursor: 'default', color: '#6c757d' } : undefined}>
                                    {crumb.name}
                                </span>
                            ) : (
                                <Link href={crumb.path}>{crumb.name}</Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default Breadcrumbs;
