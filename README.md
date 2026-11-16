# CloudCostIQ

A vanilla HTML/CSS/JavaScript dashboard for comparing public cloud infrastructure costs (AWS and Google Cloud) with an on-premises infrastructure estimate.

## Features
- 37signals-style reference workload and custom workload mode
- AWS EC2 and Google Compute Engine compute snapshots
- Object storage, egress, managed-service allowances and backup allowance
- On-premises server, storage, rack, electricity, PUE, network, support and staffing model
- 5- and 7-year cumulative TCO charts
- Break-even month, cost composition and sensitivity charts
- CSV export
- Pricing source register

## Run locally
No build step is required. Open `index.html` in a browser. For best results, serve the folder with a local static server:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

Internet access is required for Chart.js, Lucide icon font and Google Fonts CDNs. The calculator itself runs in the browser.

## Important modeling notes
This is a planning prototype, not a vendor quote or procurement recommendation.

- Snapshot date: 2026-11-12.
- Currency: USD.
- Cloud regions: AWS `us-east-1`; Google Cloud `us-east4`.
- Hours per month: 730.
- AWS M7i compute snapshot is sourced from a third-party price listing and must be checked in the AWS Pricing Calculator before formal use.
- Google Cloud C4 compute snapshot is taken from Google's published general-purpose VM pricing page.
- AWS 1-year/3-year commitment reductions in this prototype are editable illustrative assumptions, not guaranteed AWS Savings Plan rates.
- Google C4 1-year/3-year compute prices are published values from the referenced Google pricing page.
- AWS storage uses an illustrative tiered S3 Standard schedule; confirm the exact region and current tier thresholds in the AWS calculator.
- GCP storage uses a rounded regional Standard snapshot. Exact location, billing unit and storage configuration must be confirmed.
- Egress, database, load-balancer and backup amounts are simplified allowances. They are not complete service-level quotes.
- On-premises server, rack, storage, power, support and salary inputs are editable engineering assumptions. Obtain vendor and colocation quotes for a real procurement model.
- The model assumes rack rental and electricity are separate. Avoid double-counting if a colocation quote bundles power/cooling.
- Hardware replacement is modeled at the end of the selected useful life. The model does not discount cash flows or calculate tax effects, financing, residual value or inflation.
- Cloud compute sizing is a simplified capacity estimate and does not simulate autoscaling, CPU architecture performance, memory constraints, licensing or peak load.

## Main formulas
Cloud compute monthly cost:

`instance count × hourly price × 730`

Cloud storage:

`stored capacity × applicable storage rate`

On-premises server count:

`ceil(required vCPU / (vCPU per server × utilization) × (1 + spare percentage))`

Facility electricity:

`IT kW × PUE × 730 × electricity price per kWh`

On-premises monthly OpEx includes electricity, rack rental, staff, support and network transit.

Cumulative TCO adds monthly recurring cost and initial CapEx. The break-even month is the first month in which on-premises cumulative spend is no greater than the selected cloud alternative.

## References
- [AWS Pricing Calculator](https://calculator.aws/)
- [AWS EC2 M7i pricing reference](https://www.economize.cloud/resources/aws/pricing/ec2/family/m7i/)
- [AWS S3 pricing](https://aws.amazon.com/s3/pricing/)
- [Google Cloud general-purpose VM pricing](https://cloud.google.com/products/compute/pricing/general-purpose)
- [Google Cloud Storage pricing](https://cloud.google.com/storage/pricing)
- [Google Cloud Pricing Calculator](https://cloud.google.com/products/calculator)
- [Dell PowerEdge R7625](https://www.dell.com/en-us/shop/servers-storage-and-networking/poweredge-r7625-rack-server/spd/poweredge-r7625/pe_r7625_tm_vi_vp_sb)
- [37signals](https://37signals.com/)
- [Colocation pricing reference](https://wattandrack.com/colocation/pricing/)


