#!/usr/bin/env python3
"""
Add region classification to all customer JSON files.

Classifies customers into Americas, EMEA, or APAC based on name patterns.
"""

import json
import os
from pathlib import Path

def classify_region(customer_name):
    """
    Classify customer into region based on name patterns.

    Args:
        customer_name (str): Customer company name

    Returns:
        str: Region code - 'EMEA', 'APAC', or 'Americas'
    """
    name_lower = customer_name.lower()

    # Specific company mappings (highest priority - exact matches)
    company_mappings = {
        'emircom': 'EMEA',  # UAE
        'liquid telecom': 'EMEA',  # Africa
        'liquid intelligent': 'EMEA',  # Africa
        'ns solutions': 'APAC',  # Japan
        'one albania': 'EMEA',  # Albania
        'dplay entertainment': 'EMEA',  # Europe
        'centrica': 'EMEA',  # UK
        'mobile interim company': 'EMEA',  # Lebanon (S.A.L.)
        'ericsson telecommunications': 'APAC',  # Philippines office
        'commverge': 'APAC',  # Philippines
        'hcl technologies': 'EMEA',  # UK office (HCL TECHNOLOGIES UK LIMITED)
        'elpedison': 'EMEA',  # Greece
        'ofcom': 'EMEA',  # UK regulator
        'pelephone': 'EMEA',  # Israel
        'rcs media': 'EMEA',  # Italy
        'sku': 'EMEA',  # Italy (SKU Italia)
    }

    # Check specific company mappings first
    for company, region in company_mappings.items():
        if company in name_lower:
            return region

    # High priority EMEA patterns (specific identifiers)
    emea_priority = [
        'uk', 'plc', 'gmbh', 'ag.', 'nv/', 'sa/', 'sa ', ' sa', 's.a.l', 'oyj',
        'albania', 'germany', 'austria', 'belgium', 'netherlands', 'finland',
        'africa', 'egypt', 'uae', 'middle east', 'emirates',
        'telekom', 'vodafone', 'telefonica', 'elisa', 'luminus', 'ziggo',
        'british', 'virgin media', 'a1 ', 'postnl', 'orange',
        'italy', 'italia', 'italian', 'greece', 'greek', 'israel', 'israeli',
        'france', 'french', 'spain', 'spanish', 'portugal', 'portuguese',
        'poland', 'polish', 'czech', 'hungary', 'romania', 'bulgaria'
    ]

    # High priority APAC patterns (check before generic patterns)
    apac_priority = [
        'telstra', 'starhub', 'maxis', 'pty', 'sdn bhd', 'pt.', 'pt ',
        'singapore', 'australia', 'philippines', 'indonesia', 'thailand',
        'malaysia', 'japan', 'japanese', 'korea', 'korean', 'india', 'indian',
        'china', 'chinese', 'taiwan', 'asia', 'hong kong', 'vietnam'
    ]

    # High priority Americas patterns (specific identifiers)
    americas_priority = [
        'at&t', 'comcast', 'verizon', 'us', 'usa', 'canada', 'canadian',
        'latin america', 'argentina', 'brazil', 'mexico', 'chile'
    ]

    # Check high priority EMEA first
    for keyword in emea_priority:
        if keyword in name_lower:
            return 'EMEA'

    # Check high priority APAC
    for keyword in apac_priority:
        if keyword in name_lower:
            return 'APAC'

    # Check high priority Americas
    for keyword in americas_priority:
        if keyword in name_lower:
            return 'Americas'

    # Generic patterns (lowest priority)
    # Inc/LLC/Corp could be anywhere, but likely Americas
    if any(x in name_lower for x in ['inc.', 'llc', 'corp', 'corporation']):
        return 'Americas'

    # Limited/Ltd is too generic - default to Americas
    # Default to Americas if no match
    return 'Americas'

def update_customer_file(file_path):
    """
    Update a customer JSON file with region classifications.

    Args:
        file_path (Path): Path to customer JSON file

    Returns:
        dict: Statistics about the update
    """
    print(f"\nProcessing: {file_path.name}")

    # Read existing data
    with open(file_path, 'r') as f:
        data = json.load(f)

    # Track statistics
    stats = {
        'total': len(data['customers']),
        'EMEA': 0,
        'APAC': 0,
        'Americas': 0
    }

    # Add region to each customer
    for customer in data['customers']:
        region = classify_region(customer['customer_name'])
        customer['region'] = region
        stats[region] += 1

    # Write updated data
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)

    print(f"  Total customers: {stats['total']}")
    print(f"  EMEA: {stats['EMEA']} ({stats['EMEA']/stats['total']*100:.1f}%)")
    print(f"  APAC: {stats['APAC']} ({stats['APAC']/stats['total']*100:.1f}%)")
    print(f"  Americas: {stats['Americas']} ({stats['Americas']/stats['total']*100:.1f}%)")

    return stats

def main():
    """Main execution function."""
    print("=" * 60)
    print("Region Classification Script")
    print("=" * 60)

    # Define customer files
    data_dir = Path(__file__).parent.parent / 'data'
    customer_files = [
        data_dir / 'customers_top80.json',           # CloudSense
        data_dir / 'customers_kandy_top80.json',     # Kandy
        data_dir / 'customers_stl_top80.json',       # STL
        data_dir / 'customers_newnet_top80.json'     # NewNet
    ]

    # Process each file
    total_stats = {
        'EMEA': 0,
        'APAC': 0,
        'Americas': 0,
        'total': 0
    }

    for file_path in customer_files:
        if not file_path.exists():
            print(f"\nWARNING: File not found: {file_path.name}")
            continue

        stats = update_customer_file(file_path)
        total_stats['EMEA'] += stats['EMEA']
        total_stats['APAC'] += stats['APAC']
        total_stats['Americas'] += stats['Americas']
        total_stats['total'] += stats['total']

    # Print summary
    print("\n" + "=" * 60)
    print("SUMMARY - All Business Units")
    print("=" * 60)
    print(f"Total customers: {total_stats['total']}")
    print(f"EMEA: {total_stats['EMEA']} ({total_stats['EMEA']/total_stats['total']*100:.1f}%)")
    print(f"APAC: {total_stats['APAC']} ({total_stats['APAC']/total_stats['total']*100:.1f}%)")
    print(f"Americas: {total_stats['Americas']} ({total_stats['Americas']/total_stats['total']*100:.1f}%)")
    print("\nRegion field added to all customer records successfully!")

if __name__ == '__main__':
    main()
