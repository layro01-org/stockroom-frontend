import { Link } from 'react-router-dom'
import { useProducts, useDeleteProduct } from '../../hooks/useProducts'
import { useCategories } from '../../hooks/useCategories'
import ProductSearch from '../../components/ProductSearch'

export default function Products() {
  const { data: products, isLoading, isError } = useProducts()
  const { data: categories } = useCategories()
  const deleteProduct = useDeleteProduct()

  const categoryMap = new Map((categories ?? []).map((c) => [c.id, c.name]))

  function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete product "${name}"? This cannot be undone.`)) return
    deleteProduct.mutate(id)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="text-slate-500 text-sm">Loading products...</div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-md bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
        Failed to load products. Please try again.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ProductSearch />

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{products?.length ?? 0} product(s)</p>
        <Link
          to="/products/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          + New Product
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {!products || products.length === 0 ? (
          <p className="px-6 py-8 text-sm text-slate-400 text-center">
            No products yet.{' '}
            <Link to="/products/new" className="text-blue-600 hover:underline">
              Add the first one.
            </Link>
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-mono text-xs text-slate-600">{product.sku}</td>
                    <td className="px-6 py-3 font-medium text-slate-800">{product.name}</td>
                    <td className="px-6 py-3 text-slate-500">
                      {product.category_id
                        ? (categoryMap.get(product.category_id) ?? '—')
                        : '—'}
                    </td>
                    <td className="px-6 py-3 text-slate-700">${product.unit_price}</td>
                    <td className="px-6 py-3">
                      <span
                        className={
                          product.quantity_in_stock < 5
                            ? 'font-semibold text-red-600'
                            : 'text-slate-700'
                        }
                      >
                        {product.quantity_in_stock}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right space-x-2 whitespace-nowrap">
                      <Link
                        to={`/products/${product.id}/edit`}
                        className="inline-flex items-center px-3 py-1 border border-slate-300 text-xs font-medium rounded text-slate-600 bg-white hover:bg-slate-50 transition-colors"
                      >
                        ✏️ Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        disabled={deleteProduct.isPending}
                        className="inline-flex items-center px-3 py-1 border border-red-200 text-xs font-medium rounded text-red-600 bg-white hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        🗑 Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
