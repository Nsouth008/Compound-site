const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const STRIPE_PRICE_MAP = {
  "compound_tee|": "price_1SthBeGSg3qlICcRkmHstNKl"
};

function sendJson(res, status, obj) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(obj));
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "method_not_allowed" });
  }

  try {
    let body = "";
    for await (const chunk of req) body += chunk;

    const { items, successUrl, cancelUrl } = JSON.parse(body || "{}");

    if (!items || !items.length) {
      return sendJson(res, 400, { error: "cart_empty" });
    }

    const line_items = items.map(item => ({
      price: STRIPE_PRICE_MAP["compound_tee|"],
      quantity: Math.max(1, item.qty || 1)
    }));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      shipping_address_collection: { allowed_countries: ["US"] },
      success_url: successUrl,
      cancel_url: cancelUrl
    });

    return sendJson(res, 200, { url: session.url });
  } catch (err) {
    return sendJson(res, 500, { error: err.message });
  }
};
