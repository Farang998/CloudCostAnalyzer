/* Snapshot metadata. Values are estimates for a reproducible teaching model.
   Refresh and validate these against the linked vendor calculators before publication. */
window.PRICING_DATA = {
  snapshotDate: "2026-11-12",
  currency: "USD",
  hoursPerMonth: 730,
  aws: {
    region: "us-east-1",
    instance: "m7i.4xlarge",
    vcpu: 16,
    memoryGiB: 64,
    hourlyOnDemand: 0.81,
    // Illustrative planning discounts only; not an AWS quote or guaranteed Savings Plan rate.
    commitmentDiscount: { "1y": 0.30, "3y": 0.45 },
    s3: { first50TB: 0.023, next450TB: 0.022, remainder: 0.021 }
  },
  gcp: {
    region: "us-east4",
    machine: "c4-standard-8",
    vcpu: 8,
    memoryGiB: 30,
    hourlyOnDemand: 0.39534,
    hourly1y: 0.2846448,
    hourly3y: 0.2134836,
    storagePerGiBMonth: 0.020
  },
  references: [
    {name:"AWS EC2 M7i pricing snapshot", kind:"Published third-party listing; validate in AWS calculator", url:"https://www.economize.cloud/resources/aws/pricing/ec2/family/m7i/"},
    {name:"Google Cloud C4 machine pricing", kind:"Official Google Cloud pricing page", url:"https://cloud.google.com/products/compute/pricing/general-purpose"},
    {name:"Amazon S3 pricing", kind:"Official AWS pricing; storage tiers, requests, retrieval and transfer", url:"https://aws.amazon.com/s3/pricing/"},
    {name:"Google Cloud Storage pricing", kind:"Official Google Cloud pricing; location and class dependent", url:"https://cloud.google.com/storage/pricing"},
    {name:"Dell PowerEdge R7625", kind:"Official product listing; configuration changes price", url:"https://www.dell.com/en-us/shop/servers-storage-and-networking/poweredge-r7625-rack-server/spd/poweredge-r7625/pe_r7625_tm_vi_vp_sb"},
    {name:"AWS Pricing Calculator", kind:"Official estimate validation tool", url:"https://calculator.aws/"},
    {name:"Google Cloud Pricing Calculator", kind:"Official estimate validation tool", url:"https://cloud.google.com/products/calculator"},
    {name:"37signals cloud exit case study", kind:"User-provided case report; company-reported figures, not audited market prices", url:"https://37signals.com/"},
    {name:"Colocation pricing reference", kind:"Indicative market survey; obtain provider quote", url:"https://wattandrack.com/colocation/pricing/"}
  ]
};
