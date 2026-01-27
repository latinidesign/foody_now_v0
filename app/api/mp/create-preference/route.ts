import { Preference } from "mercadopago"
import { client } from "@/lib/mercadopago"


export async function POST(req: Request) {
  const { plan, user } = await req.json()

  const preference = new Preference(client)

  const external_reference = [
    "user", user.id,
    "plan", plan.name,
    Date.now()
    ].join("_")


  const response = await preference.create({
    body: {
      items: [
        {
          id: plan.name,
          title: plan.display_name,
          description: plan.description,
          picture_url: plan.image_url || "https://foodynow.com.ar/foodynow_logo-wt.svg",
          quantity: 1,
          unit_price: plan.price,
          currency_id: plan.currency || "ARS",
        },
      ],
      back_urls: {
      success: process.env.APP_URL + "/admin/subscription/success",
      failure: process.env.APP_URL + "/admin/subscription/failure",
      pending: process.env.APP_URL + "/admin/subscription/pending",
    },
        auto_return: "approved",
        notification_url: process.env.APP_URL + "/api/webhooks/mercadopago",
      external_reference: external_reference,
    }
  })

  return Response.json({
    init_point: response.init_point
  })
}
