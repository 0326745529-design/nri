/* NRI International — built-in detail-page content for the catalog products.
   Used until you edit a product's "Detail page" in Admin → Products (what you save there replaces it).
   Everything below is taken from the product specifications on this site; edit freely. */
window.NRI_PRODUCT_PAGES = {
  'woven-brand-labels': {
    statement: 'From a single-colour main label to a detailed eight-colour logo — woven, cut and folded in-line, ready for the production floor.',
    variants: [
      { name: 'Damask labels', text: 'High-density damask weaves that hold fine logos and small type with a refined, silk-like surface.',
        applications: ['Main brand labels', 'Premium apparel', 'Outerwear and tailoring'],
        attributes: ['Fine weft counts for intricate logos', 'Up to 8 yarn colors per design', 'Hot-cut or ultrasonic edges'] },
      { name: 'Satin labels', text: 'Smooth, soft satin faces that feel gentle against the skin — suited to labels worn next to the neck.',
        applications: ['Neck labels', 'Underwear and activewear', "Children's wear"],
        attributes: ['Soft hand-feel', 'End-fold, center-fold and book-fold finishes', 'Recycled polyester base available'] },
      { name: 'Care & size labels', text: 'Taffeta and plain-weave labels for sizes, fibre content and care symbols, cut and folded to your spec.',
        applications: ['Care labels', 'Size labels', 'Country-of-origin labels'],
        attributes: ['Plain and double-face weaves', 'Cut and fold completed in-line', 'MOQ 1,000 pcs per design'] }
    ],
    common: { title: 'Applicable to all woven labels', items: ['Bases: damask, satin, taffeta, recycled polyester', 'Hot-cut, ultrasonic, end-fold, center-fold, book-fold', 'Lead time 7 – 10 days', 'MOQ 1,000 pcs per design'] }
  },
  'custom-hang-tags': {
    statement: 'Hang tags that finish the garment — printed, foiled, eyeleted and strung in one place.',
    variants: [
      { name: 'Kraft & recycled tags', text: 'Natural kraft and recycled boards for a honest, low-impact look.',
        applications: ['Casual and denim wear', 'Eco-positioned collections'], attributes: ['Recycled and FSC options on request', 'Cotton or jute stringing'] },
      { name: 'Art-board tags', text: 'Smooth ivory and white boards that carry full-colour print and premium finishes.',
        applications: ['Premium and fashion labels', 'Seasonal campaigns'], attributes: ['300 – 800 gsm', 'Foil stamping, emboss, deboss, spot UV, letterpress'] },
      { name: 'Die-cut specialty tags', text: 'Custom shapes, sizes and stringing so the tag becomes part of the brand.',
        applications: ['Signature collections', 'Gift and limited editions'], attributes: ['Fully custom die-cut shapes', 'Eyelet with cotton, jute, elastic or safety-pin stringing'] }
    ],
    common: { title: 'Applicable to all hang tags', items: ['Eyeleting and stringing completed in-house', 'MOQ 1,000 pcs per design', 'Lead time 7 – 10 days'] }
  },
  'metal-labels-plates': {
    statement: 'Metal that carries the brand — engraved, embossed or laser-marked, plated safely for skin contact.',
    variants: [
      { name: 'Plates & badges', text: 'Brass, zinc alloy, aluminium or stainless plates with a crisp logo.',
        applications: ['Bags and leather goods', 'Jackets and denim', 'Footwear'], attributes: ['Embossed, engraved or laser-marked logos', 'Gold, silver, gunmetal, black oxide or painted finish'] },
      { name: 'Rivet-on labels', text: 'Labels fixed through pre-set holes with rivets for a durable, premium attachment.',
        applications: ['Jeans and workwear', 'Accessories'], attributes: ['Rivet-on fitting', 'Nickel-free plating'] },
      { name: 'Sew-on tags', text: 'Metal tags with sewing holes for garments that cannot take a rivet.',
        applications: ['Knitwear', 'Soft goods'], attributes: ['Sew-on fitting', 'REACH & CPSIA compliant plating'] }
    ],
    common: { title: 'Applicable to all metal labels', items: ['Nickel-free, REACH & CPSIA compliant plating', 'MOQ 1,000 pcs per design', 'Lead time 7 – 10 days'] }
  },
  'elastic-bands': {
    statement: 'Elastic dyed to your Pantone and tested for elongation on every lot.',
    variants: [
      { name: 'Woven elastic', text: 'Dense, stable bands with controlled elongation — the dependable all-rounder.',
        applications: ['Waistbands', 'Cuffs', 'Sportswear'], attributes: ['Widths 5 mm – 100 mm', 'Elongation 60% – 180%, tested per lot'] },
      { name: 'Knitted elastic', text: 'Soft, flexible knits that stay comfortable next to the skin.',
        applications: ['Underwear', 'Masks', 'Lingerie'], attributes: ['Soft hand-feel', 'Polyester, nylon or cotton-covered rubber'] },
      { name: 'Braided elastic', text: 'Narrow, strong braids for drawstring-style and fine closures.',
        applications: ['Cuffs and hems', 'Masks', 'Accessories'], attributes: ['Fine widths', 'TPU and polyester options'] }
    ],
    common: { title: 'Applicable to all elastic bands', items: ['Pantone / physical sample dye matching', 'Per-lot elongation testing', 'MOQ 3,000 m per design', 'Lead time 7 – 10 days'] }
  },
  'jacquard-logo-elastic': {
    statement: 'Your logo woven into the band itself — crisp on the front, soft on the skin side.',
    variants: [
      { name: 'Jacquard waistband', text: 'Logo repeats registered accurately across every roll, with a brushed back for comfort.',
        applications: ['Underwear', 'Sportswear', 'Socks'], attributes: ['Widths 15 mm – 80 mm', 'Up to 6 yarn colors per repeat', 'Soft-brushed back side'] },
      { name: 'Gripper options', text: 'Jacquard bands with a gripping back for garments that must stay in place.',
        applications: ['Activewear', 'Fitted garments'], attributes: ['Gripper back available', 'Repeat-accurate logo registration'] }
    ],
    common: { title: 'Applicable to all jacquard elastics', items: ['Computerized jacquard needle looms', 'MOQ 3,000 m per design', 'Lead time 7 – 10 days'] }
  },
  'twill-tape-webbing': {
    statement: 'The workhorse of garment construction, dyed across a full shade card.',
    variants: [
      { name: 'Herringbone twill tape', text: 'The classic zig-zag weave for seam binding and trims.',
        applications: ['Seam binding', 'Hanging loops', 'Aprons'], attributes: ['Widths 8 mm – 70 mm', 'Low shrinkage'] },
      { name: 'Plain twill tape', text: 'Smooth, even tapes for labels, piping and edges.',
        applications: ['Binding', 'Labelling', 'Packaging ties'], attributes: ['Polyester, cotton or poly-cotton', 'Azo-free dyes'] },
      { name: 'Heavy webbing', text: 'Strong, flat webbing with high loop strength for straps and bags.',
        applications: ['Bag straps', 'Workwear', 'Utility garments'], attributes: ['High loop strength', '100 m – 1,000 m rolls, tailored splits'] }
    ],
    common: { title: 'Applicable to all tapes and webbing', items: ['Full shade card, azo-free dyes', 'MOQ 3,000 m per color', 'Lead time 7 – 10 days'] }
  },
  'drawcords-tips': {
    statement: 'Cords tipped in-house so every length, crimp and aglet colour comes out consistent.',
    variants: [
      { name: 'Round braided cords', text: 'Round braids in the diameters hoodies and joggers need, finished with a clean crimp.',
        applications: ['Hoodies', 'Joggers', 'Bags'], attributes: ['3 mm – 12 mm diameters', 'Cut to consistent length'] },
      { name: 'Flat braided cords', text: 'Flat cords that lie smoothly in the waistband and spread pressure.',
        applications: ['Sweatpants', 'Shorts', 'Parkas'], attributes: ['Flat braided construction', 'Colors dyed to match'] },
      { name: 'Twisted & piping cords', text: 'Twisted cords and piping for trims, edges and decorative finishes.',
        applications: ['Decorative trims', 'Cushions and bags'], attributes: ['Twisted and piping constructions', 'Metal, ABS or recycled-plastic tips'] }
    ],
    common: { title: 'Applicable to all drawcords', items: ['Tips: metal, ABS, recycled plastic; engraved logo aglets', 'MOQ 5,000 pcs per style', 'Lead time 7 – 10 days'] }
  },
  'poly-bags': {
    statement: 'Garment bags that protect the product, carry the brand and meet retail regulations.',
    variants: [
      { name: 'Self-seal bags', text: 'Adhesive-lip bags that close in one press.',
        applications: ['Apparel packing', 'Retail shelves'], attributes: ['LDPE, CPP or recycled film', 'Suffocation warnings printed'] },
      { name: 'Gusseted bags', text: 'Extra capacity for thicker garments and folded sets.',
        applications: ['Knitwear', 'Outerwear'], attributes: ['Gusseted construction', '30 – 80 gauge (custom)'] },
      { name: 'Resealable bags', text: 'Bags that open and close again for e-commerce returns and storage.',
        applications: ['E-commerce', 'Retail packaging'], attributes: ['Resealable closure', 'Up to 100% PCR or compostable films'] }
    ],
    common: { title: 'Applicable to all poly bags', items: ['Printing up to 8 colors, matte or gloss finishing', 'Child-resistant adhesive options', 'MOQ 5,000 pcs per design', 'Lead time 7 – 10 days'] }
  },
  'paper-bags': {
    statement: 'Every delivery becomes an unboxing moment — printed inside and out.',
    variants: [
      { name: 'Twisted-rope handle bags', text: 'The classic luxury retail bag with a soft twisted handle.',
        applications: ['Boutiques', 'Gifting'], attributes: ['120 – 350 gsm art paper', 'Matte, gloss or soft-touch lamination'] },
      { name: 'Flat-handle bags', text: 'Flat paper, ribbon or die-cut handles for everyday retail.',
        applications: ['Retail stores', 'Events'], attributes: ['Kraft and recycled stocks', 'FSC options available'] }
    ],
    common: { title: 'Applicable to all paper bags', items: ['1 – 8 colors, inside & outside', 'Foil and spot UV finishes', 'MOQ 2,000 pcs per design', 'Lead time 7 – 10 days'] }
  },
  'export-cartons': {
    statement: 'Cartons engineered for the longest sea routes and marked to your buyer manual.',
    variants: [
      { name: 'Master cartons', text: '3-ply to 7-ply corrugated boards sized for your shipment.',
        applications: ['Export shipments', 'Palletised loads'], attributes: ['3-ply, 5-ply, 7-ply boards', 'Bursting-strength and drop-test certificates per lot'] },
      { name: 'Inner boxes', text: 'Die-cut, RSC and telescopic inner boxes printed with handling marks.',
        applications: ['Inner packing', 'Retail-ready cartons'], attributes: ['Flexo print 1 – 4 colors', 'Shipping marks and handling icons'] }
    ],
    common: { title: 'Applicable to all cartons', items: ['Recycled and virgin kraft liners', 'MOQ 1,000 pcs per size', 'Lead time 7 – 10 days'] }
  },

  /* ── Products added later in the admin (your catalog) ─────────────────────
     Wording stays close to each product's own tagline/description. Edit anything in
     Admin → Products → Detail page (what you save there replaces this text). */
  'threads': {
    statement: 'Export-oriented threads wound, dyed and checked for the sewing, overlocking and finishing lines of garment makers.',
    variants: [
      { name: 'Sewing threads', text: 'Smooth, strong threads for lockstitch and overlock seams, supplied on cones in the shades your garments need.',
        applications: ['Woven and knit garments', 'Denim and workwear', 'Outerwear and uniforms'],
        attributes: ['Consistent tension and strength on high-speed machines', 'Colors matched to your shade reference', 'Cone and tube packing for the factory floor'], image: 'images/products/threads-cones.webp' },
      { name: 'Spools & cones for finishing', text: 'Finished spools that keep their color batch-to-batch so topstitching and trims match from first lot to repeat order.',
        applications: ['Topstitching', 'Buttonholes and bar-tacks', 'Trims and labels'],
        attributes: ['Wide shade range', 'Dye-lot consistency across repeat orders'], image: 'images/products/threads-spools.webp' }
    ],
    common: { title: 'Applicable to all threads', items: ['Export-oriented quality control', 'Shade matching to your reference', 'Packed for export shipment'] },
    gallery: [['images/products/threads-cones.webp', 'Thread cones in assorted shades'], ['images/machines/threads-winding.webp', 'Winding and finishing']]
  },
  'buttons': {
    statement: 'Cutting-edge quality and reliability in every button — plastic and metal, matched to the garment and tested to hold.',
    variants: [
      { name: 'Plastic & resin buttons', text: 'Polyester and resin buttons in the sizes, hole counts and finishes your styles call for.',
        applications: ['Shirts and blouses', 'Dresses', "Children's wear"],
        attributes: ['2-hole and 4-hole styles', 'Matte, gloss and natural-look finishes', 'Colors matched to your fabric'], image: 'images/products/buttons-wood.webp' },
      { name: 'Metal buttons, snaps & rivets', text: 'Metal buttons, snaps and rivets that stay put through wear and washing.',
        applications: ['Jeans and workwear', 'Jackets', 'Bags and accessories'],
        attributes: ['Antique brass, silver and gunmetal-style finishes', 'Logo engraving or embossing on request'], image: 'images/products/rivets-snaps.webp' }
    ],
    common: { title: 'Applicable to all buttons', items: ['Custom logo and design on request', 'Quality checked for secure attachment', 'Packed for export shipment'] },
    gallery: [['images/products/buttons-wood.webp', 'Natural-look buttons'], ['images/products/rivets-snaps.webp', 'Metal buttons and rivets'], ['images/machines/button-sewing.webp', 'Button attaching in production']]
  },
  'covered-yarns': {
    statement: 'State-of-the-art covered yarn manufacturing, with a focus on responsible raw materials.',
    variants: [
      { name: 'Single-covered yarns', text: 'An elastic core wrapped with one covering yarn — stable, even and easy to knit or weave.',
        applications: ['Socks and hosiery', 'Knitted fabrics', 'Elastic webbing'],
        attributes: ['Even covering for a uniform surface', 'Choice of core and cover materials'], image: 'images/products/covered-yarns.webp' },
      { name: 'Double-covered yarns', text: 'Two covering layers for extra coverage, strength and a softer, more finished hand.',
        applications: ['Sportswear', 'Shapewear', 'Narrow elastic fabrics'],
        attributes: ['Balanced twist', 'Responsible raw-material sourcing focus'], image: 'images/products/threads-spools.webp' }
    ],
    common: { title: 'Applicable to all covered yarns', items: ['Modern covering machinery', 'Focus on responsible raw materials', 'Consistent quality lot to lot'] },
    gallery: [['images/machines/covered-yarns.webp', 'Covering machines in production'], ['images/products/threads-spools.webp', 'Finished yarn packages']]
  },
  'heat-transfer-label': {
    statement: 'Reinforce your brand image and communicate important information directly on key products with our heat transfer services.',
    variants: [
      { name: 'Tagless neck labels', text: 'Brand and size printed straight onto the garment — no tag to scratch, nothing to cut out.',
        applications: ['T-shirts and activewear', 'Underwear', "Children's wear"],
        attributes: ['Soft, flat finish against the skin', 'Sharp logo detail'], image: 'images/products/heat-transfer-label.webp' },
      { name: 'Size & care information', text: 'Sizes, fibre content and care symbols applied cleanly and permanently.',
        applications: ['Care instructions', 'Size and country of origin', 'Batch information'],
        attributes: ['Wash-durable application', 'Multiple language layouts'], image: 'images/machines/heat-transfer-line.webp' }
    ],
    common: { title: 'Applicable to all heat transfer labels', items: ['Custom artwork and colors', 'Applied with controlled heat and pressure', 'Packed for export shipment'] },
    gallery: [['images/machines/heat-transfer-line.webp', 'Heat transfer production line']]
  },
  'printed-fabrics-label-pfl': {
    statement: 'High-volume printed fabric labels with cutting, folding and curing support integrated in one process.',
    variants: [
      { name: 'Printed satin labels', text: 'Printed satin faces with strong color and fine text for brand and care labels.',
        applications: ['Main brand labels', 'Care and content labels', 'Size labels'],
        attributes: ['Full-color artwork', 'Cut and fold completed in-line'], image: 'images/products/printed-fabrics-label.webp' },
      { name: 'Cured & finished labels', text: 'Curing support keeps ink fast through washing, so labels look the same after the garment has.',
        applications: ['High-volume programs', 'Repeat orders'],
        attributes: ['Cutting, folding and curing in one flow', 'Consistent color across runs'], image: 'images/machines/pfl-machine.webp' }
    ],
    common: { title: 'Applicable to all printed fabric labels', items: ['High-volume production capacity', 'Integrated cut, fold and curing support', 'Custom artwork and sizes'] },
    gallery: [['images/machines/pfl-machine.webp', 'PFL printing machine']]
  },
  'zippers': {
    statement: 'Zips that run smoothly and last — metal and coil styles in the lengths, tapes and pullers your styles need.',
    variants: [
      { name: 'Metal zippers', text: 'Brass-look and antique finishes with strong teeth for jeans, jackets and bags.',
        applications: ['Jeans', 'Jackets', 'Bags'], attributes: ['Custom puller and logo', 'Tape color matched to fabric'], image: 'images/products/zipper.webp' },
      { name: 'Coil zippers', text: 'Flexible coil zips for lighter garments and curved seams.',
        applications: ['Dresses and skirts', 'Sportswear', 'Home textiles'], attributes: ['Lightweight and flexible', 'Cut-to-length or continuous'], image: 'images/machines/zippers.png' }
    ],
    common: { title: 'Applicable to all zippers', items: ['Custom pullers and logo engraving', 'Tape colors dyed to match', 'Packed for export shipment'] }
  },
  'rivets': {
    statement: 'Rivets, snaps and studs set cleanly and securely — built for jeans, workwear and accessories.',
    variants: [
      { name: 'Rivets & studs', text: 'Domed and flat rivets that reinforce stress points and carry your logo.',
        applications: ['Jeans pockets', 'Workwear', 'Bags'], attributes: ['Brass and alloy bodies', 'Engraved or embossed caps'], image: 'images/products/rivets-snaps.webp' },
      { name: 'Snap buttons', text: 'Snap fasteners with a firm, repeatable close.',
        applications: ['Jackets', 'Childrenswear', 'Shirts'], attributes: ['Several sizes and finishes', 'Colors on request'], image: 'images/machines/rivets.png' }
    ],
    common: { title: 'Applicable to all rivets and snaps', items: ['Custom logo caps', 'Plating and finishes to your sample', 'Packed for export shipment'] },
    gallery: [['images/machines/rivets.png', 'Setting rivets on the line']]
  }
};
window.NRI_PRODUCT_PAGES['heat-transfer-label-2'] = window.NRI_PRODUCT_PAGES['heat-transfer-label'];

/* Extra photos per product (path, caption). The product photo and the machine photo are added automatically. */
(function () {
  var G = {
    'woven-brand-labels': [['images/machines/woven-labels-loom.webp', 'Computerized needle-loom weaving'], ['images/machines/narrow-loom.webp', 'Narrow-fabric loom hall'], ['images/products/labels-cards.webp', 'Premium label and card finishing']],
    'custom-hang-tags': [['images/products/hangtags-leather.webp', 'Embossed leather-look tags'], ['images/machines/hang-tags-press.webp', 'Offset printing press']],
    'metal-labels-plates': [['images/machines/metal-labels-engraver.webp', 'Plate engraving and marking'], ['images/products/rivets-snaps.webp', 'Rivets and metal trims']],
    'elastic-bands': [['images/products/webbing-rolls.webp', 'Rolls in a range of shades'], ['images/machines/narrow-loom.webp', 'Narrow-fabric weaving']],
    'jacquard-logo-elastic': [['images/machines/narrow-loom.webp', 'Narrow-fabric jacquard weaving'], ['images/products/webbing-rolls.webp', 'Finished rolls']],
    'twill-tape-webbing': [['images/products/webbing-rolls.webp', 'Webbing rolls'], ['images/machines/narrow-loom.webp', 'Weaving hall']],
    'drawcords-tips': [['images/machines/threads-winding.webp', 'Yarn winding for cord making'], ['images/products/threads-cones.webp', 'Cord and thread stock']],
    'poly-bags': [['images/products/packaging-set.webp', 'Film and gift packaging sets']],
    'paper-bags': [['images/products/packaging-set.webp', 'Retail packaging presentation']],
    'export-cartons': [['images/products/packaging-set.webp', 'Packed sets ready for shipping']],
    'zippers': [['images/machines/zippers.png', 'Zip assembly']]
  };
  Object.keys(G).forEach(function (slug) {
    var page = window.NRI_PRODUCT_PAGES[slug] = window.NRI_PRODUCT_PAGES[slug] || {};
    if (!page.gallery) page.gallery = G[slug].map(function (g) { return { image: g[0], caption: g[1] }; });
  });
  Object.keys(window.NRI_PRODUCT_PAGES).forEach(function (slug) {
    var page = window.NRI_PRODUCT_PAGES[slug];
    if (Array.isArray(page.gallery)) page.gallery = page.gallery.map(function (g) { return Array.isArray(g) ? { image: g[0], caption: g[1] } : g; });
  });
})();
