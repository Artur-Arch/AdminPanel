import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Plus, Edit, Trash, Loader2, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import "./styles/TaomlarSoz.css";

export default function TaomlarSoz() {
  const [menu, setMenu] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newCategory, setNewCategory] = useState("Hammasi");
  const [dishes, setDishes] = useState({
    id: null,
    name: "",
    date: "",
    price: "",
    image: null,
    categoryId: null,
    createdAt: null,
    category: null,
  });
  const [categoryList, setCategoryList] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const fetchMenu = () => {
    setLoading(true);
    axios("https://alikafecrm.uz/product")
      .then((res) => setMenu(res.data))
      .catch((err) => console.error("Menyuştlashda xatolik:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  useEffect(() => {
    setLoading(true);
    axios("https://alikafecrm.uz/category")
      .then((res) => setCategoryList(res.data))
      .catch((err) => console.error("Kategoriya olishda xatolik:", err))
      .finally(() => setLoading(false));
  }, []);

  const resetDish = () => {
    setDishes({
      id: null,
      name: "",
      date: "",
      price: "",
      image: null,
      categoryId: null,
      createdAt: null,
      category: null,
    });
  };

  const handleAddDish = () => {
    if (
      !dishes.name ||
      isNaN(parseInt(dishes.price)) ||
      (!dishes.image && !editing)
    ) {
      alert("Iltimos, barcha maydonlarni to'ldiring.");
      return;
    }

    if (editing) {
      const formdata = new FormData();
      formdata.append("name", dishes.name);
      formdata.append("price", parseInt(dishes.price));
      formdata.append("date", dishes.date);
      formdata.append("categoryId", dishes.categoryId);

      if (typeof dishes.image !== "string") {
        formdata.append("image", dishes.image);
      }

      axios
        .put(`https://alikafecrm.uz/product/${dishes.id}`, formdata)
        .then(() => {
          fetchMenu();
          setShowModal(false);
          setEditing(false);
          resetDish();
        })
        .catch((err) => {
          console.error("Xatolik tahrirlashda:", err);
        });
    } else {
      const formdata = new FormData();
      formdata.append("name", dishes.name);
      formdata.append("price", parseInt(dishes.price));
      formdata.append("date", dishes.date);
      formdata.append("image", dishes.image);
      const catId = parseInt(dishes.categoryId);
      if (isNaN(catId)) {
        alert("Iltimos, kategoriya tanlang.");
        return;
      }
      formdata.append("categoryId", catId);

      axios.post("https://alikafecrm.uz/product", formdata).then(() => {
        fetchMenu();
        setShowModal(false);
        setEditing(false);
        resetDish();
      });
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Taomni o'chirishni istaysizmi?")) {
      axios
        .delete(`https://alikafecrm.uz/product/${id}`)
        .then(() => fetchMenu())
        .catch((err) => {
          alert("Bu taom o'chirib bo'lmaydi. Balki u zakazga bog'langan.");
          console.error("O'chirishda xatolik:", err);
        });
    }
  };

  const handleDeleteCategory = (id) => {
    if (window.confirm("Kategoriyani o'chirishni istaysizmi?")) {
      axios
        .delete(`https://alikafecrm.uz/category/${id}`)
        .then(() => {
          axios("https://alikafecrm.uz/category").then((res) =>
            setCategoryList(res.data)
          );
          setNewCategory("Hammasi");
        })
        .catch((err) => {
          alert("Kategoriyani o'chirib bo'lmadi. Balki u taomga bog'langan.");
          console.error("Kategoriya o'chirishda xatolik:", err);
        });
    }
  };

  const handleEdit = (dish) => {
    setDishes({
      id: dish.id,
      name: dish.name,
      date: dish.date,
      price: dish.price,
      image: dish.image,
      categoryId: dish.categoryId ?? null,
      createdAt: dish.createdAt ?? null,
    });
    setEditing(true);
    setShowModal(true);
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -150, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 150, behavior: "smooth" });
    }
  };

  const filteredMenu =
    newCategory === "Hammasi"
      ? menu
      : menu.filter((item) => item.category?.name === newCategory);

  const formatPrice = (price) => {
    const priceStr = price.toString();
    const formatted = priceStr.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return formatted + " so'm";
  };

  return (
    <div className="container">
      <header
        style={{
          backgroundColor: "var(--color-primary)",
          color: "var(--color-white)",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          left: 0,
          right: 0,
          marginTop: "var(--spacing-10)",
        }}
      >
        <div className="header-container">
          <h1 className="header-title">Taomlar sozlamasi</h1>
        </div>
      </header>
      <section>
        <div className="category-tabs-container">
          <button style={{
            marginBottom: "20px",
            marginRight: "10px"
          }} className="scroll-arrow left" onClick={scrollLeft}>
            <ChevronLeft size={30} />
          </button>
          <nav className="category-tabs" ref={scrollRef}>
            {["Hammasi", ...categoryList.map((cat) => cat.name)].map((cat) => {
              const realCat = categoryList.find((c) => c.name === cat);
              return (
                <div key={cat} style={{ display: "flex", alignItems: "center" }}>
                  <button
                    className={`category-tab ${
                      newCategory === cat ? "active" : ""
                    }`}
                    onClick={() => setNewCategory(cat)}
                  >
                    {cat}
                  </button>
                  {cat !== "Hammasi" && (
                    <button
                      className="food-card-button delete"
                      onClick={() => handleDeleteCategory(realCat?.id)}
                    >
                      <Trash size={16} />
                    </button>
                  )}
                </div>
              );
            })}
          </nav>
          <button style={{
            marginBottom: "20px",
            marginLeft: "10px"
          }} className="scroll-arrow right" onClick={scrollRight}>
            <ChevronRight size={30} />
          </button>
        </div>

        {loading ? (
          <div className="spinner"></div>
        ) : filteredMenu.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Plus size={48} />
            </div>
            <h2 className="empty-state-title">Taomlar topilmadi</h2>
            <p className="empty-state-text">
              Yangi taom qo'shish uchun Hammasi ga o'tib {<Plus />} tugmani
              bosing.
            </p>
          </div>
        ) : (
          <div className="food-grid">
            <article
              className="add-food-card"
              onClick={() => setShowModal(true)}
            >
              <div className="add-food-icon">
                <Plus size={32} />
              </div>
              <h3 className="add-food-text">Taom qo'shish</h3>
            </article>
            {filteredMenu.map((i) => (
              <article key={i.id} className="food-card">
                <div className="food-card-image-container">
                  <img
                    className="food-card-image"
                    src={`https://alikafecrm.uz${i.image}`}
                    alt={i.name}
                  />
                </div>
                <div className="food-card-content">
                  <h3 className="food-card-title">{i.name}</h3>
                  <div className="food-card-meta">
                    <div className="food-card-time">
                      <Clock size={16} className="food-card-time-icon" />
                      <span>{i.date ? `${i.date} min` : "Vaqti yo'q"}</span>
                    </div>
                  </div>
                  <div className="food-card-price">{formatPrice(i.price)}</div>
                  <div className="food-card-actions">
                    <button
                      className="food-card-button edit"
                      onClick={() => handleEdit(i)}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="food-card-button delete"
                      onClick={() => handleDelete(i.id)}
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        {showModal && (
          <div
            className={`modal-backdrop ${showModal ? "active" : ""}`}
            onClick={() => {
              setShowModal(false);
              setEditing(false);
              resetDish();
            }}
          >
            <div className="modal fade-in" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">
                  {editing ? "Taomni tahrirlash" : "Yangi taom qo'shish"}
                </h2>
              </div>
              <div className="modal-body1">
                {editing && typeof dishes.image === "string" && (
                  <img
                    src={`https://alikafecrm.uz${dishes.image}`}
                    alt="Current"
                    style={{
                      width: "100px",
                      marginBottom: "var(--spacing-3)",
                      borderRadius: "var(--radius-md)",
                    }}
                  />
                )}
                <div className="form-group">
                  <label className="form-label">Taom nomi</label>
                  <input
                    type="text"
                    placeholder="Taom nomi"
                    className="form-control"
                    value={dishes.name || ""}
                    onChange={(e) =>
                      setDishes({ ...dishes, name: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Narxi</label>
                  <input
                    type="number"
                    placeholder="Narxi"
                    className="form-control"
                    value={dishes.price || ""}
                    onChange={(e) =>
                      setDishes({ ...dishes, price: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tayyorlanish vaqti (min)</label>
                  <input
                    type="number"
                    placeholder="Tayyorlanish vaqti (min)"
                    className="form-control"
                    value={dishes.date || ""}
                    onChange={(e) =>
                      setDishes({ ...dishes, date: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Rasm (JPG formatda)</label>
                  <input
                    type="file"
                    className="form-control"
                    onChange={(e) =>
                      setDishes({ ...dishes, image: e.target.files[0] })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Kategoriya</label>
                  <select
                    className="form-control"
                    value={dishes.categoryId || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDishes({
                        ...dishes,
                        categoryId: val === "" ? null : parseInt(val),
                      });
                    }}
                  >
                    <option value="">Kategoriya tanlang</option>
                    {categoryList.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div
                  className="form-group"
                  style={{
                    display: "flex",
                    gap: "var(--spacing-3)",
                    alignItems: "flex-end",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Yangi kategoriya nomi</label>
                    <input
                      type="text"
                      placeholder="Yangi kategoriya nomi"
                      className="form-control"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                    />
                  </div>
                  <button
                    className="btn btn-success"
                    onClick={() => {
                      if (!newCategory.trim()) {
                        alert("Kategoriya nomini kiriting.");
                        return;
                      }
                      axios
                        .post("https://alikafecrm.uz/category", {
                          name: newCategory.trim(),
                        })
                        .then((res) => {
                          const added = res.data;
                          setCategoryList((prev) => [...prev, added]);
                          setDishes((prev) => ({
                            ...prev,
                            categoryId: added.id,
                          }));
                          setNewCategory("");
                        })
                        .catch((err) => {
                          console.error("Kategoriya qo'shishda xatolik:", err);
                          alert("Kategoriya qo'shilmadi.");
                        });
                    }}
                  >
                    Qo'shish
                  </button>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-success" onClick={handleAddDish}>
                  {editing ? "Saqlash" : "Qo'shish"}
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    setShowModal(false);
                    setEditing(false);
                    resetDish();
                  }}
                >
                  Bekor qilish
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}