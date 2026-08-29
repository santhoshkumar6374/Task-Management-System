const Pagination = ({ page, pages, onPageChange }) => {
  if (pages <= 1) return null;

  const pageNumbers = [];
  for (let i = 1; i <= pages; i++) pageNumbers.push(i);

  return (
    <div className="pagination">
      <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        ‹ Prev
      </button>
      {pageNumbers.map((num) => (
        <button
          key={num}
          className={num === page ? 'active' : ''}
          onClick={() => onPageChange(num)}
        >
          {num}
        </button>
      ))}
      <button disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
        Next ›
      </button>
    </div>
  );
};

export default Pagination;
