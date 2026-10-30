from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
root=Path.cwd();assets=root/'docs/showcase/production-web';frames=[];font=ImageFont.load_default(size=21)
flows={
'customer-ordering.gif':[('customer-discovery.jpg','Discover restaurants'),('customer-menu.jpg','Browse a real menu'),('customer-cart.jpg','Persist a cart'),('customer-checkout.jpg','Review a synthetic COD checkout'),('customer-order-success.jpg','Order created'),('customer-order-tracking.jpg','Read the persisted order')],
'operations-tour.gif':[('restaurant-overview.jpg','Restaurant performance'),('restaurant-orders.jpg','Restaurant order queue'),('restaurant-menu.jpg','Restaurant menu management'),('admin-overview.jpg','Admin overview'),('admin-orders.jpg','Admin order management'),('driver-dashboard.jpg','Driver availability and realtime'),('driver-history.jpg','Driver trip history'),('driver-earnings.jpg','Driver earnings')]
}
for name,steps in flows.items():
 frames=[]
 for filename,caption in steps:
  with Image.open(assets/filename) as src:
   im=src.convert('RGB');im.thumbnail((1080,760));canvas=Image.new('RGB',(1080,820),'#f5f7f8');canvas.paste(im,((1080-im.width)//2,60));d=ImageDraw.Draw(canvas);d.rectangle((0,0,1080,59),fill='#111827');d.text((20,8),caption,font=font,fill='white');d.text((20,36),'FoodFlow | Production demo | Captured keyframes, edited pacing',fill='#d1d5db');frames.append(canvas.quantize(colors=128))
 frames[0].save(assets/name,save_all=True,append_images=frames[1:],duration=1900,loop=0,disposal=2,optimize=True)
 print(name,(assets/name).stat().st_size,'bytes',len(frames),'frames')
sheet=Image.new('RGB',(1600,4*340),'#e6e6e6');d=ImageDraw.Draw(sheet)
for i,f in enumerate(sorted(assets.glob('*.jpg'))):
 im=Image.open(f).convert('RGB');im.thumbnail((390,310));x=i%4*400;y=i//4*340;sheet.paste(im,(x,y+22));d.text((x+3,y+3),f.stem,fill='black')
sheet.save(root/'plans/20261030-production-showcase/reports/contact-sheet.jpg')
