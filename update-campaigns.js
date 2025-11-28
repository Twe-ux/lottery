const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;

async function updateCampaigns() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    const Campaign = mongoose.model(
      "Campaign",
      new mongoose.Schema(
        {
          qrCodeUrl: String,
          commerceId: mongoose.Schema.Types.ObjectId,
        },
        { collection: "campaigns" }
      )
    );

    const Commerce = mongoose.model(
      "Commerce",
      new mongoose.Schema(
        {
          slug: String,
        },
        { collection: "commerces" }
      )
    );

    const campaigns = await Campaign.find();
    console.log(`Found ${campaigns.length} campaigns`);

    for (const campaign of campaigns) {
      if (campaign.qrCodeUrl && campaign.qrCodeUrl.includes("/lottery?")) {
        const oldUrl = campaign.qrCodeUrl;
        campaign.qrCodeUrl = campaign.qrCodeUrl.replace(
          "/lottery?",
          "/welcome?"
        );
        await campaign.save();
        console.log(`✅ Updated campaign ${campaign._id}`);
        console.log(`   Old: ${oldUrl}`);
        console.log(`   New: ${campaign.qrCodeUrl}`);
      } else if (!campaign.qrCodeUrl && campaign.commerceId) {
        const commerce = await Commerce.findById(campaign.commerceId);
        if (commerce) {
          const baseUrl = "http://localhost:3000";
          campaign.qrCodeUrl = `${baseUrl}/${commerce.slug}/welcome?c=${campaign._id}`;
          await campaign.save();
          console.log(
            `✅ Generated URL for campaign ${campaign._id}: ${campaign.qrCodeUrl}`
          );
        }
      }
    }

    console.log("\n🎉 All campaigns updated successfully");
    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

updateCampaigns();
